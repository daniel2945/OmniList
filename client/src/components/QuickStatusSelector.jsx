import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { addOrUpdateListItem } from "../api/listService";

const statusConfigByDomain = {
  game: [
    { value: "plan_to_play", label: "מתכנן לשחק" },
    { value: "playing", label: "משחק כרגע" },
    { value: "completed", label: "סיימתי" },
    { value: "dropped", label: "ננטש" },
  ],
  destination: [
    { value: "plan_to_visit", label: "רוצה לבקר" },
    { value: "visited", label: "ביקרתי" },
    { value: "completed", label: "סיימתי" },
    { value: "dropped", label: "ננטש" },
  ],
  movie: [
    { value: "plan_to_watch", label: "מתכנן לצפות" },
    { value: "watching", label: "צופה כרגע" },
    { value: "completed", label: "סיימתי" },
    { value: "dropped", label: "ננטש" },
  ],
  tv: [
    { value: "plan_to_watch", label: "מתכנן לצפות" },
    { value: "watching", label: "צופה כרגע" },
    { value: "completed", label: "סיימתי" },
    { value: "dropped", label: "ננטש" },
  ],
};

const getStatusColor = (status) => {
  if (status === "completed" || status === "visited")
    return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
  if (status === "playing" || status === "watching")
    return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
  if (status === "dropped")
    return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
  return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
};

const QuickStatusSelector = ({
  item,
  mediaItem,
  currentStatus,
  domain: domainProp,
  onListUpdate,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const media = item?.mediaItem || mediaItem || item;
  if (!media) return null;

  const domain =
    domainProp ||
    item?.mediaItem?.type ||
    mediaItem?.type ||
    media?.type ||
    item?.type ||
    "movie";

  const options = statusConfigByDomain[domain] || statusConfigByDomain.movie;

  const rawStatus = item?.status || currentStatus;
  const isValidOption = options.some((opt) => opt.value === rawStatus);
  const status = isValidOption ? rawStatus : options[0]?.value || "plan_to_watch";

  const [localStatus, setLocalStatus] = useState(status);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const stopEvent = (e) => {
    e.stopPropagation();
  };

  const handleChange = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === (localStatus || status)) return;

    const targetId = item?._id || media?._id;
    setLocalStatus(newStatus);

    try {
      setIsUpdating(true);
      if (onListUpdate && targetId) {
        onListUpdate(targetId, newStatus, media);
      }

      const res = await addOrUpdateListItem({
        externalId: media.externalId,
        type: media.type || domain,
        title: media.title,
        posterPath: media.posterPath || media.backdropPath || media.metadata?.imageUrl,
        status: newStatus,
        address: media.address,
      });

      if (onListUpdate && targetId && res) {
        onListUpdate(targetId, newStatus, res?.data?.mediaItem || res?.mediaItem || media);
      }

      const matchedLabel =
        options.find((o) => o.value === newStatus)?.label || newStatus;
      toast.success(`הסטטוס עודכן ל-${matchedLabel}`, {
        id: `status-update-${media.externalId || targetId}`,
      });
    } catch (err) {
      toast.error("שגיאה בעדכון הסטטוס");
      setLocalStatus(status);
      if (onListUpdate && targetId) {
        onListUpdate(targetId, status, media);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="relative inline-flex items-center text-right z-30 shrink-0"
      onClick={stopEvent}
      onMouseDown={stopEvent}
      onMouseUp={stopEvent}
      onTouchStart={stopEvent}
      onPointerDown={stopEvent}
    >
      {isUpdating ? (
        <div
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-md font-bold text-[9.5px] sm:text-[11px] flex items-center gap-1 min-w-[55px] sm:min-w-[65px] justify-center ${getStatusColor(
            localStatus || status
          )}`}
        >
          <Loader2 className="w-3 h-3 animate-spin text-current" />
        </div>
      ) : (
        <div className="relative flex items-center">
          <select
            value={localStatus || status || ""}
            onChange={handleChange}
            onClick={stopEvent}
            onMouseDown={stopEvent}
            onMouseUp={stopEvent}
            onTouchStart={stopEvent}
            onPointerDown={stopEvent}
            onKeyDown={(e) => e.stopPropagation()}
            className={`appearance-none cursor-pointer pl-5 sm:pl-6 pr-1.5 sm:pr-2 py-0.5 sm:py-1 border rounded-md font-bold text-[9.5px] sm:text-[11px] outline-none transition-all shadow-2xs ${getStatusColor(
              localStatus || status
            )}`}
            title="לחץ לשינוי סטטוס מהיר"
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-slate-800 font-normal"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 pointer-events-none absolute left-1 sm:left-1.5 text-current opacity-70" />
        </div>
      )}
    </div>
  );
};

export default QuickStatusSelector;

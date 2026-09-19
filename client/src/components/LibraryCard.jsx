import { Link } from "react-router-dom";
import { GripVertical, Trash2, MapPin, X } from "lucide-react";
import QuickStatusSelector from "./QuickStatusSelector";

const LibraryCard = ({
  media,
  item,
  viewMode = "grid",
  itemType,
  itemStatus,
  isManualSort = false,
  isDragging = false,
  dragHandleProps = null,
  innerRef = null,
  draggableProps = null,
  onDelete = null,
  DeleteIcon = Trash2,
  onListUpdate,
  getImageSrc,
}) => {
  const targetMedia = media || item?.mediaItem || item;
  if (!targetMedia) return null;

  const type = itemType || targetMedia.type || "movie";
  const externalId = targetMedia.externalId;
  const title = targetMedia.title || "ללא כותרת";
  const imageSrc = getImageSrc
    ? getImageSrc(targetMedia)
    : targetMedia.posterPath || targetMedia.backdropPath;

  return (
    <div
      ref={innerRef}
      {...(draggableProps || {})}
      className={`group/card relative bg-white rounded-2xl overflow-hidden border transition-all ${
        isDragging
          ? "shadow-xl ring-2 ring-indigo-500 border-transparent z-50 scale-105 bg-white"
          : "border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
      } ${
        viewMode === "list"
          ? "flex flex-row items-stretch sm:items-center min-h-[5.5rem] sm:h-28"
          : "flex flex-col h-full"
      }`}
    >
      {/* Drag handle for manual reordering */}
      {isManualSort && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-md z-20 cursor-grab active:cursor-grabbing transition-colors hover:bg-black/80"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Delete / Remove button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className={`absolute top-2 left-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg z-20 transition-all opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 cursor-pointer shadow-xs border border-slate-200 ${
            isManualSort && dragHandleProps ? "hidden" : ""
          }`}
        >
          <DeleteIcon className="w-4 h-4" />
        </button>
      )}

      {/* Poster / Thumbnail Link */}
      <Link
        to={`/item/${type}/${externalId}`}
        className={`bg-slate-100 flex-shrink-0 overflow-hidden block relative ${
          viewMode === "list"
            ? "w-20 sm:w-24 self-stretch sm:h-full"
            : "w-full aspect-[2/3]"
        } ${isManualSort ? "cursor-default" : "cursor-pointer"}`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            draggable="false"
            alt={title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.classList.remove("hidden");
              }
            }}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center text-xs text-slate-400 ${
            imageSrc ? "hidden" : ""
          }`}
        >
          {type === "destination" ? (
            <MapPin className="w-6 h-6 text-amber-500/80" />
          ) : (
            "אין תמונה"
          )}
        </div>
      </Link>

      {/* Content Body */}
      {viewMode === "list" ? (
        <div className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between flex-grow min-w-0 gap-1 sm:gap-4 pl-9 sm:pl-3">
          <Link
            to={`/item/${type}/${externalId}`}
            className={`min-w-0 flex-grow text-right ${
              isManualSort ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <h3
              className="font-bold text-slate-700 text-xs sm:text-sm md:text-base line-clamp-2 leading-snug break-words transition-colors hover:text-indigo-600"
              title={title}
            >
              {title}
            </h3>
          </Link>

          <div
            className="flex items-center gap-1.5 shrink-0 justify-start sm:justify-end pt-0.5 sm:pt-0 z-30"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <span className="bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-md uppercase font-bold tracking-wider text-[9px] sm:text-[10px] shrink-0">
              {type}
            </span>
            <QuickStatusSelector
              item={item}
              mediaItem={targetMedia}
              currentStatus={itemStatus}
              domain={type}
              onListUpdate={onListUpdate}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="p-2 sm:p-2.5 flex flex-col flex-grow min-w-0 justify-center min-h-[2.5rem] sm:min-h-[2.75rem]">
            <Link
              to={`/item/${type}/${externalId}`}
              className={`block text-center ${
                isManualSort ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <h3
                className="font-bold text-slate-700 text-xs sm:text-sm leading-snug text-center line-clamp-3 sm:line-clamp-2 break-words hyphens-auto transition-colors hover:text-indigo-600"
                title={title}
              >
                {title}
              </h3>
            </Link>
          </div>

          <div
            className="px-1.5 sm:px-2 pb-2 mt-auto z-30 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 flex-wrap sm:flex-nowrap"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          >
            <span className="bg-slate-100 text-slate-600 px-1 sm:px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider text-[8.5px] sm:text-[10px] shrink-0">
              {type}
            </span>
            <QuickStatusSelector
              item={item}
              mediaItem={targetMedia}
              currentStatus={itemStatus}
              domain={type}
              onListUpdate={onListUpdate}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LibraryCard;

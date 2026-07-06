import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Star,
  Calendar,
  Library,
  Check,
  Clock,
  Layers,
  MonitorPlay,
  Film,
  Tv,
  Gamepad2,
  BookmarkCheck,
  MapPin,
  Globe,
  Phone,
} from "lucide-react";
import { getMediaDetails } from "../api/mediaService";
import { addOrUpdateListItem, getUserList } from "../api/listService";
import { getDestinationDetails } from "../api/destinationService";
import { getCollections, addItemToCollection, createCollection } from "../api/collectionService";
import useAuthStore from "../store/useAuthStore";

const fallbackDescriptions = {
  game: "No description available for this game.",
  movie: "No overview available for this movie.",
  tv: "No overview available for this TV show.",
};

const ItemDetails = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("");

  // פיצול הסטייטים של ה-IDs למניעת בלבול מול השרת
  const [listItemId, setListItemId] = useState(null); // ה-ID של ה-ListItem (למחיקה/סטטוס)
  const [mediaItemId, setMediaItemId] = useState(null); // ה-ID של ה-MediaItem (להוספה לאוספים)
  const [currentSavedStatus, setCurrentSavedStatus] = useState("");

  useEffect(() => {
    const fetchAllDetails = async () => {
      try {
        setIsLoading(true);
        let data;
        if (type === "destination") {
          data = await getDestinationDetails(id);
        } else {
          data = await getMediaDetails(id, type);
        }
        setItem(data);

        if (user) {
          const userList = await getUserList();
          const existingItem = userList.find(
            (i) => i.mediaItem && i.mediaItem.externalId === id && i.mediaItem.type === type,
          );
          if (existingItem) {
            setListItemId(existingItem._id);
            setMediaItemId(existingItem.mediaItem._id); // שליפת ה-ID הגלובלי של מונגו
            setSelectedStatus(existingItem.status);
            setCurrentSavedStatus(existingItem.status);
          }

          const userCollections = await getCollections();
          setCollections((userCollections || []).filter((c) => c && (c.type || "movie") === type));
        }
      } catch (error) {
        toast.error("שגיאה בטעינת הנתונים");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllDetails();
  }, [type, id, user, navigate]);

  useEffect(() => {
    if (item) {
      document.title = `OmniList - ${item.title || item.name}`;
    } else {
      document.title = "OmniList - פרטים";
    }
  }, [item]);

  const getStatusLabel = (status) => {
    const mapping = {
      plan_to_play: "מתכנן לשחק",
      playing: "משחק כרגע",
      plan_to_watch: "מתכנן לצפות",
      watching: "צופה כרגע",
      completed: "סיימתי",
      dropped: "ננטש",
      plan_to_visit: "רוצה לבקר",
      visited: "ביקרתי",
    };
    return mapping[status] || status;
  };

  const handleSaveToList = async () => {
    if (!user) return toast.error("עליך להתחבר כדי לשמור פריטים לרשימה");
    if (!selectedStatus) return toast.error("נא לבחור סטטוס מהרשימה");

    try {
      setIsSaving(true);
      const savedItem = await addOrUpdateListItem({
        externalId: id,
        type: type,
        title: item?.title || item?.name,
        posterPath: item?.posterPath,
        backdropPath: item?.backdropPath,
        status: selectedStatus,
        rating: 0,
        address: item?.address,
      });

      setCurrentSavedStatus(selectedStatus);

      // עדכון ה-IDs המדויקים שהשרת החזיר
      if (savedItem && savedItem._id) {
        setListItemId(savedItem._id);
        const mid = savedItem.mediaItem?._id || savedItem.mediaItem;
        setMediaItemId(mid);
      } else {
        const updatedList = await getUserList();
        const found = updatedList.find((i) => i.mediaItem.externalId === id);
        if (found) {
          setListItemId(found._id);
          setMediaItemId(found.mediaItem._id);
        }
      }

      toast.success("הספרייה עודכנה בהצלחה!");
    } catch (error) {
      toast.error("שגיאה בשמירת הפריט");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection) return toast.error("אנא בחר אוסף מהרשימה");

    try {
      await addItemToCollection(selectedCollection, mediaItemId);
      toast.success("התוכן הועבר לאוסף המבוקש!");
      setSelectedCollection("");
    } catch (error) {
      toast.error(error.message || "שגיאה בשיוך הפריט לאוסף");
    }
  };



  let statusOptions = [];
  if (type === "game") {
    statusOptions = [
      { value: "plan_to_play", label: "מתכנן לשחק" },
      { value: "playing", label: "משחק כרגע" },
      { value: "completed", label: "סיימתי" },
      { value: "dropped", label: "ננטש" },
    ];
  } else if (type === "destination") {
    statusOptions = [
      { value: "plan_to_visit", label: "רוצה לבקר" },
      { value: "visited", label: "ביקרתי" },
      { value: "completed", label: "סיימתי" },
      { value: "dropped", label: "ננטש" },
    ];
  } else {
    // movie or tv
    statusOptions = [
      { value: "plan_to_watch", label: "מתכנן לצפות" },
      { value: "watching", label: "צופה כרגע" },
      { value: "completed", label: "סיימתי" },
      { value: "dropped", label: "ננטש" },
    ];
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-slate-500 animate-pulse">
          טוען נתונים...
        </div>
      </div>
    );
  if (!item) return null;

  const descriptionText =
    item?.overview ||
    item?.description_raw ||
    item?.description ||
    (type === "destination"
      ? `Find out more about ${item.title}.`
      : fallbackDescriptions[type]);

  const renderFallbackIcon = () => {
    if (type === "movie") return <Film className="w-16 h-16 text-slate-300" />;
    if (type === "tv") return <Tv className="w-16 h-16 text-slate-300" />;
    // הוספת אייקון חלופי ליעדים
    if (type === "destination")
      return <MapPin className="w-16 h-16 text-slate-300" />;
    return <Gamepad2 className="w-16 h-16 text-slate-300" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="relative h-64 md:h-80 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        {item?.backdropPath ? (
          <>
            <img
              src={item.backdropPath}
              alt="רקע"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-90"></div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative -mt-24 md:-mt-32 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0 w-48 md:w-64 z-10 bg-slate-100 rounded-xl shadow-xl border-4 border-white/10 flex items-center justify-center overflow-hidden h-[280px] md:h-[380px]">
            {item?.posterPath ? (
              <img
                src={item.posterPath}
                alt={item?.title || item?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              renderFallbackIcon()
            )}
          </div>

          <div className="flex-grow pt-4 md:pt-32 text-center md:text-right z-10">
            {currentSavedStatus && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full mb-3 shadow-sm animate-fade-in">
                <BookmarkCheck className="w-4 h-4" />
                <span>סטטוס בספרייה: {getStatusLabel(currentSavedStatus)}</span>
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-bold text-slate-800 md:text-white mb-2 drop-shadow-md md:drop-shadow-none">
              {item?.title || item?.name}
            </h1>

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-medium text-slate-600 md:text-slate-300 mb-6">
              {item?.releaseDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {item.releaseDate.substring(0, 4)}
                </span>
              )}
              {item?.voteAverage > 0 && (
                <span className="flex items-center gap-1 text-amber-400 md:text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  {item.voteAverage.toFixed(1)}
                </span>
              )}

              {/* פרטי מדיה בלבד */}
              {type !== "destination" && (
                <>
                  {(item?.runtime > 0 || item?.duration > 0) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {item.runtime || item.duration}{" "}
                      {type === "game" ? "שעות" : "דקות"}
                    </span>
                  )}
                  {item?.totalSeasons > 0 && type === "tv" && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      {item.totalSeasons} עונות
                    </span>
                  )}
                  {item?.totalEpisodes > 0 && type === "tv" && (
                    <span className="flex items-center gap-1">
                      <MonitorPlay className="w-4 h-4" />
                      {item.totalEpisodes} פרקים
                    </span>
                  )}
                  {item?.episodeRuntime > 0 && type === "tv" && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {item.episodeRuntime} דק' לפרק
                    </span>
                  )}
                </>
              )}

              {/* פרטי יעד בלבד */}
              {type === "destination" && item.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {item.address}
                </span>
              )}

              {/* פרטי יעד נוספים */}
              {type === "destination" && item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              {type === "destination" && item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{item.phone}</span>
                </a>
              )}

              <span className="bg-indigo-50 md:bg-indigo-500/20 text-indigo-700 md:text-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                {type}
              </span>
            </div>

            <div
              className="text-slate-700 leading-relaxed mb-8 max-w-3xl text-lg text-center md:text-right"
              dir="auto"
            >
              <div dangerouslySetInnerHTML={{ __html: descriptionText }} />
            </div>

            {/* הצגת מפה ופרטים נוספים עבור יעדים */}
            {type === "destination" && item.location && (
              <div className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 mb-8 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 justify-end">
                  מיקום על המפה <MapPin className="w-5 h-5 text-indigo-600" />
                </h3>
                <div className="h-80 w-full rounded-lg overflow-hidden border border-slate-300">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(item.address || item.title || item.name)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
                {item.address && (
                  <p className="text-center text-sm text-slate-500 mt-3">
                    {item.address}
                  </p>
                )}
              </div>
            )}

            {/* כפתורי ניהול */}
            <div className="flex flex-col md:flex-row gap-4 w-full justify-center md:justify-start">
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 w-full md:w-auto text-right shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 justify-end text-sm md:text-base">
                  {type === "destination" ? "ניהול ביעדים שלי" : "ניהול בספרייה שלי"}{" "}
                  <Library className="w-5 h-5 text-indigo-600" />
                </h3>
                <div className="flex gap-2 w-full">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 py-2.5 px-3 md:px-4 rounded-xl outline-none flex-grow text-sm cursor-pointer"
                  >
                    <option value="" disabled>
                      בחר סטטוס...
                    </option>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveToList}
                    disabled={isSaving || !selectedStatus}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-sm flex-shrink-0"
                  >
                    {isSaving ? (
                      "שומר..."
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> שמור
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* פאנל ההוספה לאוספים */}
              {mediaItemId && (
                <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 w-full md:w-auto text-right shadow-sm animate-fade-in">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 justify-end text-sm md:text-base">
                    {type === "destination" ? "הוסף לאוסף טיול" : "הוסף לאוסף / טרילוגיה"}{" "}
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </h3>
                  <div className="flex gap-2 w-full">
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 py-2.5 px-3 md:px-4 rounded-xl outline-none flex-grow text-sm cursor-pointer"
                      disabled={collections.length === 0}
                    >
                      {collections.length > 0 ? (
                        <>
                          <option value="" disabled>
                            בחר אוסף...
                          </option>
                          {collections.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="">אין אוספים זמינים</option>
                      )}
                    </select>
                    <button
                      onClick={handleAddToCollection}
                      disabled={!selectedCollection || collections.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:bg-slate-300 text-sm flex-shrink-0"
                    >
                      שייך פריט
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;

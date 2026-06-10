import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Calendar, Library, Check, Clock, Layers, MonitorPlay, Film, Tv, BookmarkCheck } from 'lucide-react';
import { getMediaDetails } from '../api/mediaService';
import { addOrUpdateListItem, getUserList } from '../api/listService';
import { getCollections, addItemToCollection } from '../api/collectionService';
import useAuthStore from '../store/useAuthStore';

const fallbackDescriptions = {
  game: "No description available for this game.",
  movie: "No overview available for this movie.",
  tv: "No overview available for this TV show."
};

const ItemDetails = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  
  // פיצול הסטייטים של ה-IDs למניעת בלבול מול השרת
  const [listItemId, setListItemId] = useState(null); // ה-ID של ה-ListItem (למחיקה/סטטוס)
  const [mediaItemId, setMediaItemId] = useState(null); // ה-ID של ה-MediaItem (להוספה לאוספים)
  const [currentSavedStatus, setCurrentSavedStatus] = useState('');

  useEffect(() => {
    const fetchAllDetails = async () => {
      try {
        setIsLoading(true);
        const data = await getMediaDetails(id, type);
        setItem(data);

        if (user) {
          const userList = await getUserList();
          const existingItem = userList.find(i => i.mediaItem.externalId === id && i.mediaItem.type === type);
          if (existingItem) {
            setListItemId(existingItem._id);
            setMediaItemId(existingItem.mediaItem._id); // שליפת ה-ID הגלובלי של מונגו
            setSelectedStatus(existingItem.status);
            setCurrentSavedStatus(existingItem.status);
          }

          const userCollections = await getCollections();
          setCollections(userCollections);
        }
      } catch (error) {
        toast.error('שגיאה בטעינת הנתונים');
        navigate('/'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllDetails();
  }, [type, id, user, navigate]);

  const getStatusLabel = (status) => {
    const mapping = {
      'plan_to_play': 'מתכנן לשחק',
      'playing': 'משחק כרגע',
      'plan_to_watch': 'מתכנן לצפות',
      'watching': 'צופה כרגע',
      'completed': 'סיימתי',
      'dropped': 'ננטש'
    };
    return mapping[status] || status;
  };

  const handleSaveToList = async () => {
    if (!user) return toast.error('עליך להתחבר כדי לשמור פריטים לרשימה');
    if (!selectedStatus) return toast.error('נא לבחור סטטוס מהרשימה');

    try {
      setIsSaving(true);
      const savedItem = await addOrUpdateListItem({
        externalId: id,
        type: type,
        title: item?.title || item?.name,
        posterPath: item?.posterPath,
        backdropPath: item?.backdropPath,
        status: selectedStatus,
        rating: 0
      });
      
      setCurrentSavedStatus(selectedStatus);
      
      // עדכון ה-IDs המדויקים שהשרת החזיר
      if (savedItem && savedItem._id) {
        setListItemId(savedItem._id);
        setMediaItemId(savedItem.mediaItem); // השרת מחזיר את ה-ID של ה-MediaItem בשדה זה
      } else {
        const updatedList = await getUserList();
        const found = updatedList.find(i => i.mediaItem.externalId === id);
        if (found) {
          setListItemId(found._id);
          setMediaItemId(found.mediaItem._id);
        }
      }

      toast.success('הספרייה עודכנה בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בשמירת הפריט');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection) return toast.error('אנא בחר אוסף מהרשימה');
    if (!mediaItemId) return toast.error('שגיאה פנימית במזהה הפריט. נסה לרענן.');
    
    try {
      // שולחים את ה-mediaItemId ולא את ה-listItemId כדי שיתאים בול ל-populate בשרת!
      await addItemToCollection(selectedCollection, mediaItemId);
      toast.success('התוכן הועבר לאוסף המבוקש!');
      setSelectedCollection('');
    } catch (error) {
      toast.error(error.message || 'הפריט כבר קיים באוסף זה');
    }
  };

  const statusOptions = type === 'game' 
    ? [
        { value: 'plan_to_play', label: 'מתכנן לשחק' },
        { value: 'playing', label: 'משחק כרגע' },
        { value: 'completed', label: 'סיימתי' },
        { value: 'dropped', label: 'ננטש' }
      ]
    : [
        { value: 'plan_to_watch', label: 'מתכנן לצפות' },
        { value: 'watching', label: 'צופה כרגע' },
        { value: 'completed', label: 'סיימתי' },
        { value: 'dropped', label: 'ננטש' }
      ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="text-xl text-slate-500 animate-pulse">טוען נתונים...</div></div>;
  if (!item) return null;

  const descriptionText = item?.overview || item?.description_raw || item?.description || fallbackDescriptions[type];

  const renderFallbackIcon = () => {
    if (type === 'movie') return <Film className="w-16 h-16 text-slate-300" />;
    if (type === 'tv') return <Tv className="w-16 h-16 text-slate-300" />;
    return <Gamepad2 className="w-16 h-16 text-slate-300" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      <div className="relative h-64 md:h-80 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        {item?.backdropPath ? (
          <>
            <img src={item.backdropPath} alt="רקע" className="w-full h-full object-cover opacity-50" />
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
              <img src={item.posterPath} alt={item?.title || item?.name} className="w-full h-full object-cover" />
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

            <h1 className="text-3xl md:text-5xl font-bold text-white md:text-slate-900 mb-2 drop-shadow-md md:drop-shadow-none">
              {item?.title || item?.name}
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-medium text-slate-200 md:text-slate-600 mb-6">
              {item?.releaseDate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{item.releaseDate.substring(0, 4)}</span>}
              {item?.voteAverage > 0 && <span className="flex items-center gap-1 text-amber-400 md:text-amber-500"><Star className="w-4 h-4 fill-current" />{item.voteAverage.toFixed(1)}</span>}
              {(item?.runtime > 0 || item?.duration > 0) && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{item.runtime || item.duration} {type === 'game' ? 'שעות' : 'דקות'}</span>}
              {item?.totalSeasons > 0 && type === 'tv' && <span className="flex items-center gap-1"><Layers className="w-4 h-4" />{item.totalSeasons} עונות</span>}
              {item?.totalEpisodes > 0 && type === 'tv' && <span className="flex items-center gap-1"><MonitorPlay className="w-4 h-4" />{item.totalEpisodes} פרקים</span>}
              {item?.episodeRuntime > 0 && type === 'tv' && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{item.episodeRuntime} דק' לפרק</span>}
              <span className="bg-indigo-600/20 md:bg-indigo-100 text-indigo-100 md:text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">{type}</span>
            </div>

            <div className="text-slate-700 leading-relaxed mb-8 max-w-3xl text-lg text-right" dir="ltr">
              <div dangerouslySetInnerHTML={{ __html: descriptionText }} />
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block text-right shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 justify-end">
                  ניהול בספרייה שלי <Library className="w-5 h-5 text-indigo-600" />
                </h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg outline-none min-w-[160px]"
                  >
                    <option value="" disabled>בחר סטטוס...</option>
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button onClick={handleSaveToList} disabled={isSaving || !selectedStatus} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                    {isSaving ? 'שומר...' : <><Check className="w-4 h-4" /> שמור</>}
                  </button>
                </div>
              </div>

              {/* פאנל ההוספה לאוספים - עכשיו נפתח ברגע שיש מזהה פריט תקין */}
              {mediaItemId && collections.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block text-right shadow-sm animate-fade-in">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 justify-end">
                    הוסף לאוסף / טרילוגיה <Layers className="w-5 h-5 text-indigo-600" />
                  </h3>
                  <div className="flex gap-2">
                    <select 
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg outline-none min-w-[180px]"
                    >
                      <option value="" disabled>בחר אוסף...</option>
                      {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <button onClick={handleAddToCollection} disabled={!selectedCollection} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-lg transition-colors cursor-pointer">
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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Film, Tv, Gamepad2, Library, FolderHeart, Plus, Trash2, X } from 'lucide-react';
import { getUserList, removeListItem } from '../api/listService';
import { getCollections, createCollection, deleteCollection, removeMediaFromCollection } from '../api/collectionService';
import useAuthStore from '../store/useAuthStore';

const MyList = () => {
  const { user } = useAuthStore();
  const [list, setList] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (user) {
        const listData = await getUserList();
        setList(listData);

        const collectionData = await getCollections();
        setCollections(collectionData);
      }
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים');
    } {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // --- יצירת רשימת מזהים שנמצאים באוספים לצורך סינון מהראשי ---
  const itemsInCollections = new Set(
    collections.flatMap(col => col.items.map(item => item?._id?.toString() || item?.toString()))
  );

  // סינון הפריטים: תואם לקטגוריה וגם לא קיים באף אוסף!
  const filteredList = list.filter(item => {
    const isCategoryMatch = activeFilter === 'all' || item.mediaItem.type === activeFilter;
    const isAlreadyInCollection = itemsInCollections.has(item.mediaItem._id?.toString());
    return isCategoryMatch && !isAlreadyInCollection;
  });

  const handleDeleteFromLibrary = async (e, listId) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה מהספרייה? (הוא יוסר גם מכל האוספים)')) return;
    
    try {
      await removeListItem(listId);
      setList(prev => prev.filter(item => item._id !== listId));
      const updatedCollections = await getCollections();
      setCollections(updatedCollections);
      toast.success('הפריט נמחק בהצלחה');
    } catch (error) {
      toast.error('שגיאה במחיקת הפריט');
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את האוסף הזה? (הפריטים עצמם יישארו בספרייה)')) return;
    
    try {
      await deleteCollection(collectionId);
      setCollections(prev => prev.filter(c => c._id !== collectionId));
      toast.success('האוסף נמחק בהצלחה');
    } catch (error) {
      toast.error('שגיאה במחיקת האוסף');
    }
  };

  const handleRemoveFromCollection = async (e, collectionId, mediaId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('האם להסיר פריט זה מהאוסף? (הוא יחזור להופיע בדף הראשי)')) return;

    try {
      await removeMediaFromCollection(collectionId, mediaId);
      setCollections(prev => prev.map(c => {
        if (c._id === collectionId) {
          return { ...c, items: c.items.filter(item => item._id !== mediaId) };
        }
        return c;
      }));
      toast.success('הפריט הוסר מהאוסף ויחזור לתצוגה הראשית');
    } catch (error) {
      toast.error('שגיאה בהסרת הפריט מהאוסף');
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      await createCollection({ name: newCollectionName, description: newCollectionDesc });
      toast.success('אוסף חדש נוצר בהצלחה!');
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowModal(false);
      const updatedCollections = await getCollections();
      setCollections(updatedCollections);
    } catch (error) {
      toast.error('שגיאה ביצירת האוסף');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center mt-20 text-xl font-medium text-slate-500 animate-pulse">טוען את הספרייה שלך...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">הספרייה שלי</h1>
        
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === 'all' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
            הכל ({list.length - itemsInCollections.size < 0 ? 0 : list.length - itemsInCollections.size})
          </button>
          <button onClick={() => setActiveFilter('movie')} className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === 'movie' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
            <Film className="w-4 h-4" /> סרטים
          </button>
          <button onClick={() => setActiveFilter('tv')} className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === 'tv' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
            <Tv className="w-4 h-4" /> סדרות
          </button>
          <button onClick={() => setActiveFilter('game')} className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === 'game' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
            <Gamepad2 className="w-4 h-4" /> משחקים
          </button>
          <button onClick={() => setActiveFilter('collections')} className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeFilter === 'collections' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
            <FolderHeart className="w-4 h-4" /> אוספים ({collections.length})
          </button>
        </div>
      </div>

      {activeFilter === 'collections' ? (
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-sm shadow-sm">
              <Plus className="w-4 h-4" /> צור אוסף חדש
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl text-right">
                <h3 className="text-xl font-bold text-slate-800 mb-4">יצירת אוסף / טרילוגיה</h3>
                <form onSubmit={handleCreateCollection} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">שם האוסף</label>
                    <input type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="לדוגמה: Marvel Cinematic Universe" required className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">תיאור קצר (אופציונלי)</label>
                    <textarea value={newCollectionDesc} onChange={(e) => setNewCollectionDesc(e.target.value)} placeholder="סדר הצפייה או פרטים על האוסף..." className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" />
                  </div>
                  <div className="flex gap-2 justify-start mt-2">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm">צור אוסף</button>
                    <button type="button" onClick={() => setShowModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer text-sm">ביטול</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {collections.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4">
              <FolderHeart className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">אין אוספים עדיין</h3>
              <p className="text-slate-500 text-sm">תוכל ליצור אוספים ידנית ולשייך אליהם סרטים, סדרות ומשחקים יחד.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {collections.map(col => (
                <div key={col._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                  
                  <button 
                    onClick={() => handleDeleteCollection(col._id)}
                    className="absolute top-4 left-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                    title="מחק אוסף זה"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div className="text-right mb-4 border-b border-slate-100 pb-3 pr-12">
                    <h2 className="text-xl font-bold text-indigo-700">{col.name}</h2>
                    {col.description && <p className="text-sm text-slate-500 mt-1">{col.description}</p>}
                  </div>
                  
                  {col.items.length === 0 ? (
                    <p className="text-sm text-slate-400 text-right italic">האוסף ריק. כנס לעמוד של פריט שמור כדי לשייך אותו לכאן.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {col.items.map(item => {
                        if (!item) return null;
                        return (
                          <Link to={`/item/${item.type}/${item.externalId}`} key={item._id} className="group/item block relative">
                            
                            <button 
                              onClick={(e) => handleRemoveFromCollection(e, col._id, item._id)}
                              className="absolute top-1 left-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-md z-10 transition-colors opacity-0 group-hover/item:opacity-100 cursor-pointer"
                              title="הסר פריט מהאוסף"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="relative h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              {item.posterPath ? (
                                <img src={item.posterPath} alt={item.title} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">אין תמונה</div>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-700 mt-2 truncate text-center group-hover/item:text-indigo-600">{item.title}</h4>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredList.length === 0 ? (
            <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm mt-4">
              <Library className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">אין פריטים להצגה בקטגוריה זו</h3>
              <p className="text-slate-500 text-sm mb-4">כל התכנים משויכים לאוספים או שטרם הוספת תוכן חדש.</p>
              <Link to="/search" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium py-2 px-5 rounded-lg text-sm cursor-pointer inline-block">עבור לחיפוש</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredList.map((item) => {
                const media = item.mediaItem;
                return (
                  <Link to={`/item/${media.type}/${media.externalId}`} key={item._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col group cursor-pointer relative">
                    
                    <button 
                      onClick={(e) => handleDeleteFromLibrary(e, item._id)}
                      className="absolute top-2 left-2 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg z-10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm border border-slate-200"
                      title="מחק מהספרייה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="relative h-64 overflow-hidden bg-slate-100">
                      {media.posterPath ? (
                        <img src={media.posterPath} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">אין תמונה</div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-800 line-clamp-1 mb-1" title={media.title}>{media.title}</h3>
                      <div className="flex justify-between items-center text-xs mt-auto pt-3">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase font-semibold tracking-wider">{media.type}</span>
                        <span className={`px-2.5 py-1 rounded-md font-medium ${
                          item.status === 'completed' ? 'bg-green-100 text-green-700' :
                          item.status === 'playing' || item.status === 'watching' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>{item.status}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyList;
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Film, Tv, Gamepad2, ChevronRight, ChevronLeft } from 'lucide-react';
import { searchMedia } from '../api/mediaService';

const Home = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('movie');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // משתני Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const tabs = [
    { id: 'movie', label: 'סרטים', icon: <Film className="w-5 h-5" /> },
    { id: 'tv', label: 'סדרות', icon: <Tv className="w-5 h-5" /> },
    { id: 'game', label: 'משחקים', icon: <Gamepad2 className="w-5 h-5" /> }
  ];

  const performSearch = async (searchQuery, type, page) => {
    setIsSearching(true);
    try {
      // הקריאה מקבלת כעת גם את העמוד
      const data = await searchMedia(searchQuery, type, page);
      setResults(data);
      setHasSearched(true);
      
      if (data.length === 0 && page === 1) {
        toast.error('לא נמצאו תוצאות לחיפוש זה.');
      } else if (data.length === 0 && page > 1) {
        toast.error('אין עוד תוצאות בעמודים הבאים.');
        setCurrentPage(page - 1); // חזרה אחורה אם הגענו לסוף
      } else {
        // גלילה חלקה למעלה כשעוברים עמוד
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      toast.error(error.message || 'שגיאה בביצוע החיפוש');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('אנא הזן מילת חיפוש');
      return;
    }
    setCurrentPage(1); // תמיד מתחילים מעמוד 1 בחיפוש חדש
    performSearch(query, activeTab, 1);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setResults([]);
    setQuery('');
    setCurrentPage(1);
    setHasSearched(false);
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    performSearch(query, activeTab, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      performSearch(query, activeTab, prevPage);
    }
  };

  return (
    <div className="mt-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          מה נשחק או נראה היום?
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          חפש סרטים, סדרות או משחקים והוסף אותם לספרייה האישית שלך. התוצאות מסודרות לפי פופולריות.
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`חפש ${tabs.find(t => t.id === activeTab)?.label} מכל העולם...`} 
            className="flex-grow px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white text-slate-800"
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
          >
            {isSearching ? 'מחפש...' : 'חיפוש'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="border-t border-slate-200 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((item) => (
              <div key={item.externalId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  {item.posterPath ? (
                    <img src={item.posterPath} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <span className="text-sm">אין תמונה</span>
                    </div>
                  )}
                  {item.releaseDate && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {item.releaseDate.substring(0, 4)}
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-grow text-center">
                  <h3 className="font-bold text-slate-800 line-clamp-2 mb-4" title={item.title}>
                    {item.title}
                  </h3>
                  <button className="mt-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg transition-colors text-sm w-full cursor-pointer">
                    צפה בפרטים
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* כפתורי מעבר עמודים */}
          <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isSearching}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              <ChevronRight className="w-5 h-5" />
              הקודם
            </button>
            
            <span className="text-slate-600 font-medium bg-slate-100 px-4 py-2 rounded-lg">
              עמוד {currentPage}
            </span>

            <button 
              onClick={handleNextPage}
              disabled={isSearching || results.length < 10} // אם חזרו פחות תוצאות ממה שה-API אמור להחזיר, אנחנו כנראה בסוף
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
            >
              הבא
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
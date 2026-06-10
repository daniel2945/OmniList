import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Film, Tv, Gamepad2, ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react';
import { searchMedia, getPopularMedia } from '../api/mediaService';

const Search = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('movie');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isShowingPopular, setIsShowingPopular] = useState(true);

  const tabs = [
    { id: 'movie', label: 'סרטים', icon: <Film className="w-5 h-5" /> },
    { id: 'tv', label: 'סדרות', icon: <Tv className="w-5 h-5" /> },
    { id: 'game', label: 'משחקים', icon: <Gamepad2 className="w-5 h-5" /> }
  ];

  // אפקט מנגנון Debounce - מאזין לשינויים בטקסט ובטאב ומחכה 500 מילישניות לפני שליחה
  useEffect(() => {
    setCurrentPage(1);
    
    if (!query.trim()) {
      loadMedia('', activeTab, 1);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      loadMedia(query, activeTab, 1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  const loadMedia = async (searchQuery, type, page) => {
    setIsSearching(true);
    try {
      let data;
      if (searchQuery.trim()) {
        data = await searchMedia(searchQuery, type, page);
        setIsShowingPopular(false);
      } else {
        data = await getPopularMedia(type, page);
        setIsShowingPopular(true);
      }
      
      if (data.length === 0 || (results.length > 0 && data[0]?.externalId === results[0]?.externalId)) {
        if (page > 1) {
          toast.error('הגעת לסוף התוצאות.');
          setCurrentPage(page - 1);
        } else {
          setResults([]);
        }
        setIsSearching(false);
        return;
      }

      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const renderFallbackIcon = (type) => {
    if (type === 'movie') return <Film className="w-12 h-12 text-slate-300" />;
    if (type === 'tv') return <Tv className="w-12 h-12 text-slate-300" />;
    return <Gamepad2 className="w-12 h-12 text-slate-300" />;
  };

  return (
    <div className="mt-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">מנוע חיפוש התוכן</h1>

        <div className="flex justify-center gap-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        <div className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`הקלד שם של ${tabs.find(t => t.id === activeTab)?.label} לחיפוש אוטומטי...`} 
            dir="ltr"
            className="w-full px-5 py-3 text-left rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white text-slate-800 font-medium"
          />
          {isSearching && (
            <div className="absolute left-4 top-3.5 text-sm text-indigo-600 font-medium animate-pulse">
              מחפש...
            </div>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="border-t border-slate-200 pt-8">
          {isShowingPopular && (
            <div className="flex items-center gap-2 mb-6 text-indigo-700 font-semibold text-lg">
              <TrendingUp className="w-5 h-5" />
              פופולריים כרגע
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((item) => {
              const hasImage = item.posterPath || item.backdropPath;
              return (
                <div key={item.externalId} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-64 flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {hasImage ? (
                      <img src={item.posterPath || item.backdropPath} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      renderFallbackIcon(item.type)
                    )}
                    {item.releaseDate && hasImage && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {item.releaseDate.substring(0, 4)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow text-center">
                    <h3 className="font-bold text-slate-800 line-clamp-2 mb-4" title={item.title}>{item.title}</h3>
                    <Link 
                      to={`/item/${item.type}/${item.externalId}`}
                      className="mt-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded-lg transition-colors text-sm w-full block text-center cursor-pointer"
                    >
                      צפה בפרטים
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            <button 
              onClick={() => { setCurrentPage(p => p - 1); loadMedia(query, activeTab, currentPage - 1); }}
              disabled={currentPage === 1 || isSearching}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" /> הקודם
            </button>
            <span className="text-slate-600 font-medium bg-slate-100 px-4 py-2 rounded-lg">עמוד {currentPage}</span>
            <button 
              onClick={() => { setCurrentPage(p => p + 1); loadMedia(query, activeTab, currentPage + 1); }}
              disabled={isSearching || results.length < 10}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              הבא <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        !isSearching && (
          <div className="text-center text-slate-400 mt-12 font-medium">
            אין תוצאות להצגה. נסה להקליד משהו אחר...
          </div>
        )
      )}
    </div>
  );
};

export default Search;
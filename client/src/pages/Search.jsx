import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Film,
  Tv,
  Gamepad2,
  MapPin,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";

import { searchMedia, getPopularMedia } from "../api/mediaService";
import {
  searchDestinations,
  getPopularDestinations,
} from "../api/destinationService";
import { getCityAndCountry } from "../utils/addressHelper";

// רשימת מדינות מורחבת ועשירה עם דגלים עבור טאב היעדים
const COUNTRIES_LIST = [
  { name: "", label: "🌎 All Countries (Global)" },
  { name: "United States", label: "🇺🇸 United States" },
  { name: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { name: "France", label: "🇫🇷 France" },
  { name: "Italy", label: "🇮🇹 Italy" },
  { name: "Spain", label: "🇪🇸 Spain" },
  { name: "Japan", label: "🇯🇵 Japan" },
  { name: "Germany", label: "🇩🇪 Germany" },
  { name: "Thailand", label: "🇹🇭 Thailand" },
  { name: "Greece", label: "🇬🇷 Greece" },
  { name: "Netherlands", label: "🇳🇱 Netherlands" },
  { name: "Switzerland", label: "🇨🇭 Switzerland" },
  { name: "Australia", label: "🇦🇺 Australia" },
  { name: "Canada", label: "🇨🇦 Canada" },
  { name: "Brazil", label: "🇧🇷 Brazil" },
  { name: "Mexico", label: "🇲🇽 Mexico" },
  { name: "South Korea", label: "🇰🇷 South Korea" },
  { name: "Portugal", label: "🇵🇹 Portugal" },
  { name: "Turkey", label: "🇹🇷 Turkey" },
  { name: "Egypt", label: "🇪🇬 Egypt" },
  { name: "India", label: "🇮🇳 India" },
  { name: "United Arab Emirates", label: "🇦🇪 United Arab Emirates" },
  { name: "Austria", label: "🇦🇹 Austria" },
  { name: "Singapore", label: "🇸🇬 Singapore" },
];



const Search = () => {
  const { activeTab: urlTab } = useParams();
  const navigate = useNavigate();
  const activeTab = urlTab || "movie";

  const [searchParams, setSearchParams] = useSearchParams();

  // אתחול מצבים לפי הכתובת במידה וקיימת
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [selectedCountry, setSelectedCountry] = useState(() => searchParams.get("country") || "");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isShowingPopular, setIsShowingPopular] = useState(true);

  const tabs = [
    { id: "movie", label: "סרטים", icon: <Film className="w-5 h-5" /> },
    { id: "tv", label: "סדרות", icon: <Tv className="w-5 h-5" /> },
    { id: "game", label: "משחקים", icon: <Gamepad2 className="w-5 h-5" /> },
    { id: "destination", label: "יעדים", icon: <MapPin className="w-5 h-5" /> },
  ];

  // סינכרון מצב מקומי עם שינוי הכתובת (למשל בניווט אחורה/קדימה)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const country = searchParams.get("country") || "";
    setQuery(q);
    setSelectedCountry(country);
  }, [searchParams]);

  // השהייה (Debounce) של עדכון הכתובת בזמן ההקלדה
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      const currentCountry = searchParams.get("country") || "";

      if (query.trim() !== currentQ || selectedCountry !== currentCountry) {
        const nextParams = {};
        if (query.trim()) nextParams.q = query.trim();
        if (selectedCountry) nextParams.country = selectedCountry;
        setSearchParams(nextParams, { replace: true });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedCountry]);

  // שליפת התוצאות בפועל כאשר הכתובת או הטאב משתנים
  useEffect(() => {
    setCurrentPage(1);
    const q = searchParams.get("q") || "";
    const country = searchParams.get("country") || "";
    loadMedia(q, activeTab, 1, country);
  }, [searchParams, activeTab]);

  const loadMedia = async (searchQuery, type, page, country) => {
    setIsSearching(true);
    try {
      let data;

      if (type === "destination") {
        if (searchQuery.trim() || country) {
          data = await searchDestinations(searchQuery, country);
          setIsShowingPopular(false);
        } else {
          data = await getPopularDestinations();
          setIsShowingPopular(true);
        }
      } else {
        if (searchQuery.trim()) {
          data = await searchMedia(searchQuery, type, page);
          setIsShowingPopular(false);
        } else {
          data = await getPopularMedia(type, page);
          setIsShowingPopular(true);
        }
      }

      if (
        data.length === 0 ||
        (results.length > 0 && data[0]?.externalId === results[0]?.externalId)
      ) {
        if (page > 1) {
          toast.error("הגעת לסוף התוצאות.");
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
      toast.error("שגיאה בשליפת הנתונים");
    } finally {
      setIsSearching(false);
    }
  };

  const renderFallbackIcon = (type) => {
    if (type === "movie") return <Film className="w-12 h-12 text-slate-300" />;
    if (type === "tv") return <Tv className="w-12 h-12 text-slate-300" />;
    if (type === "destination")
      return <MapPin className="w-12 h-12 text-slate-300" />;
    return <Gamepad2 className="w-12 h-12 text-slate-300" />;
  };

  return (
    <div className="mt-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
          חיפוש וגילוי תוכן
        </h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          מצא סרטים, סדרות, משחקים ויעדי תיירות מכל העולם והוסף אותם לרשימה האישית שלך
        </p>

        {/* טאבים מובנים עם cursor-pointer קבוע */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                navigate(`/search/${tab.id}`);
                setQuery("");
                setSelectedCountry("");
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md transform scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* שורת החיפוש והסינון המאוחדת – יושבים יחד באותה שורה */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-3 items-stretch justify-center px-4">
          {activeTab === "destination" && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium cursor-pointer shadow-sm md:w-64 text-right"
              dir="rtl"
            >
              {COUNTRIES_LIST.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-grow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "destination"
                  ? "Type a city name (e.g. Tokyo, Paris, Kyoto)..."
                  : `הקלד שם של ${tabs.find((t) => t.id === activeTab)?.label} לחיפוש...`
              }
              dir="ltr"
              className="w-full px-5 py-3 text-left rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white text-slate-800 font-medium h-full"
            />
            {isSearching && (
              <div className="absolute left-4 top-3.5 text-sm text-indigo-600 font-medium animate-pulse">
                מחפש...
              </div>
            )}
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="border-t border-slate-200 pt-8">
          {isShowingPopular && (
            <div className="flex items-center gap-2 mb-6 text-indigo-700 font-semibold text-lg justify-end px-4">
              <TrendingUp className="w-5 h-5" />
              <span>
                {activeTab === "destination"
                  ? "Popular Worldwide Destinations"
                  : "פופולריים כרגע"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
            {results.map((item) => {
              const hasImage = item.posterPath || item.backdropPath;
              return (
                <div
                  key={item.id || item.externalId}
                  className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[2/3] w-full flex-shrink-0 overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100">
                    {hasImage ? (
                      <img
                        src={item.posterPath || item.backdropPath}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      renderFallbackIcon(item.type)
                    )}
                    {item.releaseDate && hasImage && (
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {item.releaseDate.substring(0, 4)}
                      </div>
                    )}
                    {/* הוספת תווית עיר ומדינה עבור יעדים */}
                    {item.type === "destination" &&
                      item.address &&
                      hasImage && (
                        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg text-left">
                          {getCityAndCountry(item.address)}
                        </div>
                      )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow text-center">
                    <h3
                      className="font-bold text-slate-800 line-clamp-2 mb-4 text-sm md:text-base leading-snug group-hover:text-indigo-600 transition-colors"
                      title={item.title}
                      dir="auto"
                    >
                      {item.title}
                    </h3>
                    <Link
                      to={`/item/${item.type}/${item.id || item.externalId}`}
                      className="mt-auto bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 font-semibold py-2 rounded-xl transition-all duration-200 text-sm w-full block text-center cursor-pointer"
                    >
                      צפה בפרטים
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {activeTab !== "destination" && (
            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
              <button
                onClick={() => {
                  setCurrentPage((p) => p - 1);
                  loadMedia(query, activeTab, currentPage - 1, selectedCountry);
                }}
                disabled={currentPage === 1 || isSearching}
                className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
                הקודם
              </button>
              <span className="text-slate-600 font-medium bg-slate-100 px-4 py-2 rounded-lg">
                עמוד {currentPage}
              </span>
              <button
                onClick={() => {
                  setCurrentPage((p) => p + 1);
                  loadMedia(query, activeTab, currentPage + 1, selectedCountry);
                }}
                disabled={isSearching || results.length < 10}
                className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                הבא <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        !isSearching && (
          <div className="text-center text-slate-400 mt-12 font-medium">
            אין תוצאות להצגה. נסה לשנות את ערכי החיפוש...
          </div>
        )
      )}
    </div>
  );
};

export default Search;

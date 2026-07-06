import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Library, CheckCircle, ArrowLeft, Star, Film } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Home = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = "OmniList - דף הבית";
  }, []);

  return (
    <div className="mt-8 text-center max-w-5xl mx-auto px-4">
      {/* Hero section with a modern deep dark/indigo gradient */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-16 mb-16 border border-slate-800 shadow-xl overflow-hidden text-right">
        {/* Abstract background glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            המרכז האישי שלך לכל <br />
            <span className="bg-gradient-to-l from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              יעד, סרט ומדיה
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed">
            גלה משחקים חדשים, עקוב אחר הסדרות שאתה צופה בהן, ותכנן את היעד הבא שלך לטיול. הכל במקום אחד - מסודר, אלגנטי ונגיש.
          </p>

          <div className="flex flex-wrap gap-4 justify-start">
            <Link 
              to="/search" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-98 flex items-center gap-2 cursor-pointer text-base"
            >
              <Search className="w-5 h-5" />
              התחל לחפש תוכן
            </Link>
            
            {!user ? (
              <Link 
                to="/register" 
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 font-semibold py-3.5 px-8 rounded-xl transition-all backdrop-blur-sm active:scale-98 cursor-pointer text-base"
              >
                צור חשבון חינם
              </Link>
            ) : (
              <Link 
                to="/my-list" 
                className="bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 font-semibold py-3.5 px-8 rounded-xl transition-all backdrop-blur-sm active:scale-98 cursor-pointer text-base flex items-center gap-2"
              >
                <Library className="w-5 h-5" />
                לספרייה שלי
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Title separator */}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 text-right pr-4 border-r-4 border-indigo-600">
        מה תוכל לעשות ב-OmniList?
      </h2>

      {/* Feature cards with modern hover effects */}
      <div className="grid md:grid-cols-3 gap-8 text-right text-slate-700">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">חיפוש מולטי-מדיה</h3>
          <p className="text-slate-500 leading-relaxed text-sm">
            חפש במאגרי מידע מקיפים כגון TMDB לסרטים וסדרות, RAWG למשחקים ו-Google Places למציאת יעדי תיירות.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">ספרייה אישית חכמה</h3>
          <p className="text-slate-500 leading-relaxed text-sm">
            נהל את המדיה והיעדים שלך. סמן סטטוס צפייה/ביקור מותאם אישית לכל סוג פריט, וסדר אותם בצורה מושלמת.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">אוספים וטרילוגיות</h3>
          <p className="text-slate-500 leading-relaxed text-sm">
            קבץ פריטים בעלי מכנה משותף לתוך אוספים ייעודיים. בטיולים, הפריטים יקובצו אוטומטית לפי המדינה שלהם.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
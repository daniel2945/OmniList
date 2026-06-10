import { Link } from 'react-router-dom';
import { Search, Library, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="mt-12 text-center max-w-4xl mx-auto">
      <div className="bg-indigo-50 rounded-3xl p-12 mb-12 border border-indigo-100 shadow-sm">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          המרכז שלך לכל תוכן המדיה
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          גלה משחקים חדשים, עקוב אחר הסדרות שאתה צופה בהן, ותכנן את ערב הסרט הבא שלך. הכל תחת קורת גג אחת, מסודר ונגיש.
        </p>

        <div className="flex justify-center gap-4">
          <Link 
            to="/search" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Search className="w-5 h-5" />
            התחל לחפש עכשיו
          </Link>
          
          {!user && (
            <Link 
              to="/register" 
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-3 px-8 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              צור חשבון חינם
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-right text-slate-700 mt-16">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Search className="w-10 h-10 text-indigo-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">חיפוש עוצמתי</h3>
          <p className="text-slate-500">חפש בכל מאגרי המידע המובילים (TMDB, RAWG) ומצא מידע מדויק על כל כותר שקיים.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Library className="w-10 h-10 text-indigo-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">ניהול רשימות</h3>
          <p className="text-slate-500">שמור פריטים, סמן אותם כ"סיימתי" או "צופה כרגע" ובנה את הספרייה הדיגיטלית שלך.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <CheckCircle className="w-10 h-10 text-indigo-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">הכל במקום אחד</h3>
          <p className="text-slate-500">סרטים, סדרות ומשחקים. אין צורך לקפוץ בין אפליקציות שונות כדי לעקוב אחר התוכן שלך.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
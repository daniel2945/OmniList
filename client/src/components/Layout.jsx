import { Outlet, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Search as SearchIcon, Library, LogOut, User } from 'lucide-react';
import useAuthStore from "../store/useAuthStore";

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation(); 

  const getLinkClass = (path) => {
    const baseClass = "transition-all font-medium text-sm md:text-base px-3 py-2 rounded-lg flex items-center gap-2 ";
    if (location.pathname === path) {
      return baseClass + "bg-indigo-50 text-indigo-700";
    }
    return baseClass + "text-slate-600 hover:bg-slate-100 hover:text-indigo-600";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Toaster position="top-center" />

      {/* תוקן ה-z-index ל-50 בצורה מוחלטת כדי למנוע מעבר של אלמנטים בזמן גלילה */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
                <Library className="w-7 h-7" />
                OmniList
              </Link>

              <div className="hidden md:flex items-center gap-2 mt-1">
                <Link to="/search" className={getLinkClass("/search")}>
                  <SearchIcon className="w-4 h-4" />
                  חיפוש תוכן
                </Link>
                
                {user && (
                  <>
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <Link to="/my-list" className={getLinkClass("/my-list")}>
                      <Library className="w-4 h-4" />
                      הספרייה שלי
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    התנתק
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="text-slate-600 hover:bg-slate-100 py-2 px-4 rounded-lg transition-colors font-medium text-sm">
                    התחברות
                  </Link>
                  <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors shadow-sm">
                    הרשמה
                  </Link>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
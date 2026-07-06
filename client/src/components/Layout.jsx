import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Search as SearchIcon, Library, LogOut, User, Menu, X } from 'lucide-react';
import useAuthStore from "../store/useAuthStore";

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation(); 
  const [isOpen, setIsOpen] = useState(false);

  const getLinkClass = (path, isMobile = false) => {
    const baseClass = isMobile
      ? "transition-all font-semibold text-base px-4 py-3 rounded-xl flex items-center gap-3 w-full "
      : "transition-all font-medium text-sm md:text-base px-3 py-2 rounded-lg flex items-center gap-2 ";
    if (location.pathname === path || location.pathname.startsWith(path + "/")) {
      return baseClass + "bg-indigo-50 text-indigo-700";
    }
    return baseClass + "text-slate-600 hover:bg-slate-100 hover:text-indigo-600";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))] bg-slate-50 text-slate-800 font-sans">
      <Toaster position="top-center" />

      {/* תוקן ה-z-index ל-50 בצורה מוחלטת עם עיצוב Glassmorphism */}
      <nav className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight flex items-center gap-2.5">
                <img src="/logo.jpg" alt="OmniList" className="w-8 h-8 rounded-lg shadow-xs border border-indigo-200/50 object-cover" />
                <span>OmniList</span>
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

            <div className="hidden md:flex items-center">
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

            {/* כפתור תפריט למובייל */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-600 hover:bg-slate-100 p-2.5 rounded-xl transition-all duration-200 active:scale-95 border border-transparent hover:border-slate-200"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6.5 h-6.5" /> : <Menu className="w-6.5 h-6.5" />}
              </button>
            </div>
            
          </div>
        </div>

        {/* תפריט מובייל נפתח */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-5 duration-200">
            <Link 
              to="/search" 
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/search", true)}
            >
              <SearchIcon className="w-5 h-5" />
              <span>חיפוש תוכן</span>
            </Link>
            
            {user && (
              <Link 
                to="/my-list" 
                onClick={() => setIsOpen(false)}
                className={getLinkClass("/my-list", true)}
              >
                <Library className="w-5 h-5" />
                <span>הספרייה שלי</span>
              </Link>
            )}
            
            <div className="pt-3 border-t border-slate-200/80">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-4 py-2.5 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl">
                    <User className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-semibold">{user.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl transition-all font-semibold cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>התנתק</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all"
                  >
                    התחברות
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md hover:shadow-indigo-500/10 transition-all"
                  >
                    הרשמה
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
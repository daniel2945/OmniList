import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import { registerUser } from '../api/authService';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    document.title = "OmniList - הרשמה";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await registerUser({ username, email, password });
      login(data, data.token);
      toast.success('ברוך הבא ל-OmniList!');
      navigate('/'); 
    } catch (error) {
      toast.error(error.message || 'שגיאה בהרשמה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">יצירת משתמש חדש</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">שם משתמש</label>
          <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
          <input type="email" dir="ltr" className="w-full px-4 py-2 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
          <input type="password" dir="ltr" className="w-full px-4 py-2 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
        </div>
        <button type="submit" disabled={isLoading} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 cursor-pointer">
          {isLoading ? 'יוצר משתמש...' : 'הרשמה'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-slate-600">
        כבר יש לך משתמש? <Link to="/login" className="text-indigo-600 hover:underline font-medium">התחבר כאן</Link>
      </div>
    </div>
  );
};

export default Register;
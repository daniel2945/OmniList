import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import { loginUser } from '../api/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password });
      login(data, data.token);
      toast.success('התחברת בהצלחה!');
      navigate('/'); 
    } catch (error) {
      toast.error(error.message || 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">התחברות למערכת</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
          <input 
            type="email" 
            dir="ltr"
            className="w-full px-4 py-2 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
          <input 
            type="password" 
            dir="ltr"
            className="w-full px-4 py-2 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
    </div>
  );
};

export default Login;
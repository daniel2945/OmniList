import { create } from 'zustand';

// מנסים לשלוף את המשתמש מהזיכרון של הדפדפן בטעינה הראשונית
const storedUser = localStorage.getItem('user');
const initialUser = storedUser ? JSON.parse(storedUser) : null;

const useAuthStore = create((set) => ({
  user: initialUser, 
  token: localStorage.getItem('token') || null,

  login: (userData, token) => {
    // שומרים גם את הטוקן וגם את אובייקט המשתמש!
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, token: token });
  },

  logout: () => {
    // מנקים הכל בעת התנתקות
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
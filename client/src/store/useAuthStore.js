import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // המשתנים שאנחנו שומרים גלובלית
  user: null, 
  token: localStorage.getItem('token') || null,

  // פונקציה לעדכון התחברות 
  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, token: token });
  },

  // פונקציה להתנתקות
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
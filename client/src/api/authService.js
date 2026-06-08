import API_CALL from './API_CALL';

// הרשמה
export const registerUser = async (userData) => {
  return await API_CALL('/auth/register', 'POST', userData);
};

// התחברות
export const loginUser = async (userData) => {
  return await API_CALL('/auth/login', 'POST', userData);
};
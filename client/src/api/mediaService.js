import API_CALL from './API_CALL';

// חיפוש חופשי
export const searchMedia = async (query, type, page = 1) => {
  return await API_CALL(`/media/search?query=${query}&type=${type}&page=${page}`, 'GET');
};

// שליפת תוכן פופולרי - הוספנו תמיכה בעמודים!
export const getPopularMedia = async (type, page = 1) => {
  return await API_CALL(`/media/popular?type=${type}&page=${page}`, 'GET');
};

// פרטי פריט מלאים
export const getMediaDetails = async (id, type) => {
  return await API_CALL(`/media/details/${id}?type=${type}`, 'GET');
};
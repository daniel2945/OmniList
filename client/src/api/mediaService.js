import API_CALL from './API_CALL';

// שליפת תוכן פופולרי
export const getPopularMedia = async (type) => {
  return await API_CALL(`/media/popular?type=${type}`, 'GET');
};

// קבלת פרטים מלאים על כותר ספציפי (כולל שעות/פרקים)
export const getMediaDetails = async (id, type) => {
  return await API_CALL(`/media/details/${id}?type=${type}`, 'GET');
};

// חיפוש כללי (עכשיו תומך בעמודים!)
export const searchMedia = async (query, type, page = 1) => {
  return await API_CALL(`/media/search?query=${query}&type=${type}&page=${page}`, 'GET');
};
import API_CALL from './API_CALL';

// משיכת כל האוספים של המשתמש
export const getCollections = async () => {
  return await API_CALL('/collections', 'GET');
};

// יצירת אוסף / טרילוגיה חדשה
export const createCollection = async (collectionData) => {
  return await API_CALL('/collections', 'POST', collectionData);
};

// הוספת פריט מדיה לאוסף ספציפי - תוקן שם המפתח ל-mediaItemId כדי להתאים בול לשרת!
export const addItemToCollection = async (collectionId, mediaItemId) => {
  return await API_CALL(`/collections/${collectionId}/add`, 'POST', { mediaItemId });
};

// מחיקת אוסף (טרילוגיה) שלם
export const deleteCollection = async (collectionId) => {
  return await API_CALL(`/collections/${collectionId}`, 'DELETE');
};

// הסרת פריט בודד מתוך אוסף ספציפי
export const removeMediaFromCollection = async (collectionId, mediaId) => {
  return await API_CALL(`/collections/${collectionId}/item/${mediaId}`, 'DELETE');
};
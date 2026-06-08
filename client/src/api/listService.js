import API_CALL from './API_CALL';

// משיכת כל הרשימה של המשתמש המחובר
export const getUserList = async () => {
  return await API_CALL('/list', 'GET');
};

// הוספה או עדכון של פריט ברשימה (שולחים את כל האובייקט עם הנתונים)
export const addOrUpdateListItem = async (itemData) => {
  return await API_CALL('/list/add', 'POST', itemData);
};

// מחיקת פריט מהרשימה (לפי ה-ID הפנימי של מונגו)
export const removeListItem = async (listId) => {
  return await API_CALL(`/list/remove/${listId}`, 'DELETE');
};
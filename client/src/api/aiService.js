import API_CALL from './API_CALL';

// צ'אט כללי מול ה-AI (מכיר את כל הרשימה של המשתמש)
export const chatWithGeneralAI = async (prompt) => {
  return await API_CALL('/ai/chat', 'POST', { prompt });
};

// צ'אט ספציפי על פריט מדיה מסוים (כולל תמיכה בהיסטוריית שיחה)
export const chatWithItemAI = async (itemId, prompt, conversationId = null) => {
  // אם יש לנו ID של שיחה קיימת, נוסיף אותו כדי שג'מיני יזכור את ההקשר
  const body = conversationId ? { prompt, conversationId } : { prompt };
  return await API_CALL(`/ai/chat/item/${itemId}`, 'POST', body);
};

// משיכת כל היסטוריית השיחות של המשתמש
export const getChatHistory = async () => {
  return await API_CALL('/ai/history', 'GET');
};
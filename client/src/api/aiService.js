import API_CALL from './API_CALL';

// צ'אט ראשי מול ה-AI (תומך בתחום ספציפי ובהיסטוריית שיחה)
export const chatWithGeneralAI = async (prompt, domain = null, conversationId = null) => {
  const body = { prompt };
  if (domain) body.domain = domain;
  if (conversationId) body.conversationId = conversationId;
  return await API_CALL('/ai/chat', 'POST', body);
};

// צ'אט ספציפי על פריט מדיה מסוים (כולל תמיכה בהיסטוריית שיחה)
export const chatWithItemAI = async (itemId, prompt, conversationId = null, extraData = {}) => {
  const body = { prompt, ...extraData };
  if (conversationId) body.conversationId = conversationId;
  return await API_CALL(`/ai/chat/item/${encodeURIComponent(itemId)}`, 'POST', body);
};

// משיכת כל היסטוריית השיחות של המשתמש
export const getChatHistory = async () => {
  return await API_CALL('/ai/history', 'GET');
};

// משיכת שיחה ספציפית לפי ID
export const getConversationById = async (conversationId) => {
  return await API_CALL(`/ai/conversation/${conversationId}`, 'GET');
};
const express = require('express');
const aiRouter = express.Router();
// הוספנו את getUserChatHistory לייבוא
const { chatWithAI, chatWithItemAI, getUserChatHistory } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth'); 

aiRouter.post('/chat', protect, chatWithAI);
aiRouter.post('/chat/item/:itemId', protect, chatWithItemAI);

// הנתיב החדש: הבאת כל היסטוריית השיחות של המשתמש
aiRouter.get('/history', protect, getUserChatHistory);

module.exports = aiRouter;
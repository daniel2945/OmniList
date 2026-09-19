const express = require('express');
const aiRouter = express.Router();
const { chatWithAI, chatWithItemAI, getUserChatHistory, getConversationById } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth'); 

aiRouter.post('/chat', protect, chatWithAI);
aiRouter.post('/chat/item/:itemId', protect, chatWithItemAI);
aiRouter.get('/history', protect, getUserChatHistory);
aiRouter.get('/conversation/:id', protect, getConversationById);

module.exports = aiRouter;
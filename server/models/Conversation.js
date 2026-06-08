const mongoose = require('mongoose');

// סכמה פנימית שמייצגת הודעה בודדת בתוך השיחה
const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'model'], // user = המשתמש, model = ג'מיני
    required: true 
  },
  content: { type: String, required: true }
}, { _id: false, timestamps: true });

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', required: true },
  title: { type: String, default: 'שיחה חדשה' }, // אפשר לתת שם לשיחה בעתיד
  messages: [messageSchema] // מערך ההודעות
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
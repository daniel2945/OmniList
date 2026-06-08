const mongoose = require('mongoose');

const userListSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  mediaItem: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MediaItem', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['wishlist', 'in-progress', 'completed', 'dropped'], 
    default: 'wishlist' 
  },
  rating: { type: Number, min: 1, max: 10 },
  review: { type: String }
}, { timestamps: true });

// אינדקס שמונע מהמשתמש להוסיף את אותו פריט פעמיים לרשימה שלו
userListSchema.index({ user: 1, mediaItem: 1 }, { unique: true });

module.exports = mongoose.model('UserList', userListSchema);
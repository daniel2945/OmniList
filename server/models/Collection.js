const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    enum: ['movie', 'tv', 'game', 'destination'], 
    required: true,
    default: 'movie'
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
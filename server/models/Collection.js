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
    enum: ['movie', 'tv', 'game'],
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaItem'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
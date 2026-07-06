const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  externalId: { type: String, required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['movie', 'tv', 'game', 'destination'], 
    required: true 
  },
  posterPath: { type: String },
  releaseDate: { type: String },
  
  // שדות מדיה (סרטים, סדרות, משחקים)
  duration: { type: Number }, 
  totalSeasons: { type: Number }, 
  totalEpisodes: { type: Number }, 
  episodeRuntime: { type: Number }, 
  
  // שדות יעדים (גוגל מפות)
  address: { type: String }, 
  
  metadata: { type: mongoose.Schema.Types.Mixed } 
}, { timestamps: true });

// מפתח ייחודי משולב כדי למנוע כפילויות של אותו פריט מאותו סוג בבסיס הנתונים
itemSchema.index({ externalId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema);
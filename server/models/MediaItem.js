const mongoose = require('mongoose');

const mediaItemSchema = new mongoose.Schema({
  externalId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['movie', 'tv', 'game'], required: true },
  posterPath: { type: String },
  releaseDate: { type: String },
  
  // -- השדות החדשים שהוספנו --
  duration: { type: Number }, // זמן בדקות לסרט, או ממוצע שעות משחק ב-RAWG
  totalSeasons: { type: Number }, // רק לסדרות
  totalEpisodes: { type: Number }, // רק לסדרות
  episodeRuntime: { type: Number }, // ממוצע אורך פרק בודד (לסדרות)
  
  metadata: { type: mongoose.Schema.Types.Mixed } 
}, { timestamps: true });

module.exports = mongoose.model('MediaItem', mediaItemSchema);
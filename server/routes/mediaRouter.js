const express = require('express');
const mediaRouter = express.Router();
// נוסיף את getMediaDetails לייבוא
const { searchMedia, getPopularMedia, getMediaDetails } = require('../controllers/mediaController');
const { protect } = require('../middlewares/auth'); 

mediaRouter.get('/search', protect, searchMedia);
mediaRouter.get('/popular', protect, getPopularMedia);

// הנתיב החדש לקבלת פרטים (מקבל את ה-ID ב-URL ואת הסוג ב-Query)
// לדוגמה: /api/media/details/3498?type=game
mediaRouter.get('/details/:id', protect, getMediaDetails);

module.exports = mediaRouter;
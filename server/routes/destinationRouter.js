const express = require('express');
const destinationRouter = express.Router();
const { 
  searchDestinations, 
  getPopularDestinations, 
  getDestinationDetails 
} = require('../controllers/destinationController');

// מכיוון שמדובר בשליפת מידע בלבד (ללא עדכון DB אישי), אין חובה לשים protect
// אבל אם אתה רוצה שהאתר יהיה סגור רק למחוברים, אפשר להוסיף את protect

destinationRouter.get('/search', searchDestinations);
destinationRouter.get('/popular', getPopularDestinations);
destinationRouter.get('/:id', getDestinationDetails); // חובה להיות בסוף כדי שלא יתנגש עם search

module.exports = destinationRouter;
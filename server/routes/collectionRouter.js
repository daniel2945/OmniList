const express = require('express');
const collectionRouter = express.Router();
const { 
  createCollection, 
  getUserCollections, 
  addItemToCollection,
  updateCollectionOrder, // הפונקציה שהוספנו קודם
  deleteCollection,
  removeMediaFromCollection
} = require('../controllers/collectionController');

// שימוש ב-middleware של ההגנה שלך
const { protect } = require("../middlewares/auth");

// קבלת כל האוספים של המשתמש המחובר
collectionRouter.get('/', protect, getUserCollections);

// יצירת אוסף חדש
collectionRouter.post('/', protect, createCollection);

// הוספת פריט מהספרייה אל אוסף ספציפי
collectionRouter.post('/:collectionId/add', protect, addItemToCollection);

// -- הראוט החדש לעדכון סדר האוסף --
collectionRouter.put('/:collectionId/order', protect, updateCollectionOrder);

// מחיקת אוסף (טרילוגיה) שלם
collectionRouter.delete('/:collectionId', protect, deleteCollection);

// הסרת פריט בודד מתוך אוסף ספציפי
collectionRouter.delete('/:collectionId/item/:mediaId', protect, removeMediaFromCollection);

module.exports = collectionRouter;
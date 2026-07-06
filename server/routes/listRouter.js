const express = require('express');
const listRouter = express.Router();
const { 
  addOrUpdateListItem, 
  getUserList, 
  removeListItem, 
  updateUserListOrder 
} = require('../controllers/listController');
const { protect } = require('../middlewares/auth'); 

// כל הנתיבים כאן מוגנים - חייבים להיות מחוברים
listRouter.post('/add', protect, addOrUpdateListItem); 
listRouter.get('/', protect, getUserList); 

// --- הראוט החדש עם לוג בדיקה מובנה ---
listRouter.put('/order', protect, (req, res, next) => {
  console.log('=== השרת קיבל בקשת גרירה וסידור בראוטר! ===');
  console.log('המידע שהגיע מהפרונטאנד:', req.body);
  next();
}, updateUserListOrder); 

listRouter.delete('/remove/:listId', protect, removeListItem);

module.exports = listRouter;
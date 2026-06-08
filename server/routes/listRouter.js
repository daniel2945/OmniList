const express = require('express');
const listRouter = express.Router();
const { addOrUpdateListItem, getUserList, removeListItem } = require('../controllers/listController');
const { protect } = require('../middlewares/auth'); 

// כל הנתיבים כאן מוגנים - חייבים להיות מחוברים
listRouter.post('/add', protect, addOrUpdateListItem); // הוספה/עדכון
listRouter.get('/', protect, getUserList); // קבלת הרשימה המלאה
listRouter.delete('/remove/:listId', protect, removeListItem);

module.exports = listRouter;
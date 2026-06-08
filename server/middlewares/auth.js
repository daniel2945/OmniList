const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // בדיקה אם קיים הדר של Authorization שמתחיל במילה Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // חילוץ הטוקן מההדר (הפורמט הוא "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // פענוח הטוקן בעזרת המפתח הסודי שלנו
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // מציאת המשתמש ב-DB לפי ה-ID שמוצפן בטוקן
      // הפונקציה select('-password') דואגת שלא נמשוך את הסיסמה המוצפנת מה-DB
      req.user = await User.findById(decoded.id).select('-password');

      // מעבר לפונקציה הבאה בשרשרת (הקונטרולר)
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // אם לא נשלח טוקן בכלל
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
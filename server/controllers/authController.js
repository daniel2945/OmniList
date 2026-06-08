const User = require('../models/User');
const jwt = require('jsonwebtoken');

// פונקציית עזר ליצירת הטוקן
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // הטוקן יהיה בתוקף ל-30 ימים
  });
};

// הרשמת משתמש חדש
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // בדיקה אם המשתמש כבר קיים לפי אימייל
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // יצירת המשתמש במסד הנתונים (הסיסמה תוצפן אוטומטית בזכות המודל שיצרנו)
    const user = await User.create({
      username,
      email,
      password
    });

    // החזרת תשובה חיובית עם פרטי המשתמש והטוקן
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// התחברות משתמש קיים
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // חיפוש המשתמש במסד הנתונים
    const user = await User.findOne({ email });

    // אם המשתמש קיים והסיסמה תואמת (בעזרת הפונקציה שיצרנו במודל)
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
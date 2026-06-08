const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, { 
  timestamps: true // יוסיף אוטומטית תאריכי יצירה ועדכון
});

// פונקציה שרצה אוטומטית *לפני* שמירת משתמש במסד הנתונים
// פונקציה שרצה אוטומטית *לפני* שמירת משתמש במסד הנתונים
userSchema.pre('save', async function () {
  // אם הסיסמה לא שונתה, פשוט נצא מהפונקציה והשמירה תמשיך כרגיל
  if (!this.isModified('password')) {
    return;
  }
  
  // יצירת "מלח" (Salt) והצפנת הסיסמה
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// מתודה אישית לבדיקת התאמת סיסמה (נשתמש בה בזמן התחברות)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRouter = require('./routes/authRouter');
const mediaRouter = require('./routes/mediaRouter');
const listRouter = require('./routes/listRouter');
const aiRouter = require('./routes/aiRouter');
const collectionRouter = require('./routes/collectionRoutes');


// טעינת משתני סביבה מקובץ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// חיבור ל-MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// חיבור הראוטים לכתובת בסיס
app.use('/api/auth', authRouter);
app.use('/api/media', mediaRouter);
app.use('/api/list', listRouter);
app.use('/api/ai', aiRouter);
app.use('/api/collections', collectionRouter);

// ראוט בסיסי לבדיקה
app.get('/', (req, res) => {
  res.send('OmniList Server is running and DB is connecting!');
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
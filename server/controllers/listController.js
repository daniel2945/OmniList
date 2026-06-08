const MediaItem = require('../models/MediaItem');
const UserList = require('../models/UserList');

// הוספה או עדכון של פריט ברשימת המשתמש
const addOrUpdateListItem = async (req, res) => {
  try {
    // הוספנו כאן את השדות החדשים לחילוץ מתוך הבקשה
    const { 
      externalId, title, type, posterPath, releaseDate, 
      duration, totalSeasons, totalEpisodes, episodeRuntime, // <- חדש
      status, rating, review 
    } = req.body;
    
    const userId = req.user._id; 

    let media = await MediaItem.findOne({ externalId });
    
    // אם המדיה לא קיימת ב-DB, ניצור אותה יחד עם הנתונים המורחבים
    if (!media) {
      media = await MediaItem.create({ 
        externalId, 
        title, 
        type, 
        posterPath, 
        releaseDate,
        duration,           // <- חדש
        totalSeasons,       // <- חדש
        totalEpisodes,      // <- חדש
        episodeRuntime      // <- חדש
      });
    }

    const userListItem = await UserList.findOneAndUpdate(
      { user: userId, mediaItem: media._id },
      { status: status || 'wishlist', rating, review }, 
      { new: true, upsert: true }
    ).populate('mediaItem');

    res.status(200).json(userListItem);

  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ message: 'Server error while updating list' });
  }
};

// שליפת כל הרשימה של המשתמש (כדי להציג לו את הווישליסט שלו)
const getUserList = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // נשלוף את כל הפריטים של המשתמש, ונביא יחד איתם את פרטי הסרט/משחק המלאים
    const list = await UserList.find({ user: userId }).populate('mediaItem');
    
    res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({ message: 'Server error while fetching list' });
  }
};

// מחיקת פריט מרשימת המשתמש
const removeListItem = async (req, res) => {
  try {
    // ה-ID של הרשומה ב-UserList (יגיע מה-URL)
    const { listId } = req.params;
    const userId = req.user._id;

    // אנחנו מוודאים שהרשומה נמחקת רק אם היא שייכת למשתמש שמבקש למחוק
    const deletedItem = await UserList.findOneAndDelete({ _id: listId, user: userId });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found in your list' });
    }

    res.status(200).json({ message: 'Item successfully removed from your list', id: listId });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ message: 'Server error while removing item' });
  }
};

// אל תשכח לייצא גם אותה למטה
module.exports = { addOrUpdateListItem, getUserList, removeListItem };
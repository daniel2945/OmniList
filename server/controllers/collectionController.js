const Collection = require('../models/Collection');
const MediaItem = require('../models/MediaItem'); 

// יצירת אוסף חדש
const createCollection = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Collection name is required' });
    }

    const newCollection = new Collection({
      user: req.user.id,
      name,
      description
    });

    await newCollection.save();
    res.status(201).json(newCollection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Server error while creating collection' });
  }
};

// משיכת כל האוספים של המשתמש המחובר
const getUserCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id }).populate('items');
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Server error while fetching collections' });
  }
};

// הוספת פריט אל תוך אוסף
const addItemToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { mediaItemId } = req.body; 

    if (!mediaItemId) {
      return res.status(400).json({ message: 'Media item ID is required' });
    }

    const collection = await Collection.findOne({ _id: collectionId, user: req.user.id });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.items.includes(mediaItemId)) {
      return res.status(400).json({ message: 'Item already exists in this collection' });
    }

    collection.items.push(mediaItemId);
    await collection.save();

    res.json({ message: 'Item added to collection successfully', collection });
  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({ message: 'Server error while adding item to collection' });
  }
};

// מחיקת אוסף (טרילוגיה) שלם
const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findOneAndDelete({ _id: collectionId, user: req.user.id });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Server error while deleting collection' });
  }
};

// הסרת פריט בודד מתוך אוסף
const removeMediaFromCollection = async (req, res) => {
  try {
    const { collectionId, mediaId } = req.params;
    
    const collection = await Collection.findOne({ _id: collectionId, user: req.user.id });
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    collection.items = collection.items.filter(id => id.toString() !== mediaId);
    await collection.save();

    res.json({ message: 'Item removed from collection successfully', collection });
  } catch (error) {
    console.error('Error removing item from collection:', error);
    res.status(500).json({ message: 'Server error while removing item from collection' });
  }
};

module.exports = { 
  createCollection, 
  getUserCollections, 
  addItemToCollection,
  deleteCollection,
  removeMediaFromCollection
};
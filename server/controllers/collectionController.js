const Collection = require("../models/Collection");
const MediaItem = require("../models/Item");

// יצירת אוסף חדש עם הגדרת סוג מדיה
const createCollection = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    if (!name || !type) {
      return res
        .status(400)
        .json({ message: "Collection name and type are required" });
    }

    if (!["movie", "tv", "game", "destination"].includes(type)) {
      return res
        .status(400)
        .json({
          message: "Invalid collection type. Must be movie, tv, game, or destination",
        });
    }

    const newCollection = new Collection({
      user: req.user.id,
      name,
      description,
      type,
    });

    await newCollection.save();
    res.status(201).json(newCollection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ message: "Server error while creating collection" });
  }
};

// משיכת כל האוספים של המשתמש המחובר
const getUserCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id }).populate(
      "items",
    );
    res.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching collections" });
  }
};

// הוספת פריט אל תוך אוסף עם בדיקת התאמת סוג (Validation)
const addItemToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { mediaItemId } = req.body;

    if (!mediaItemId) {
      return res.status(400).json({ message: "Media item ID is required" });
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      user: req.user.id,
    });
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // שליפת הפריט כדי לבדוק את הסוג שלו
    const mediaItem = await MediaItem.findById(mediaItemId);
    if (!mediaItem) {
      return res.status(404).json({ message: "Media item not found" });
    }

    // ולידציה: בדיקה האם סוג הפריט תואם לסוג האוסף
    const collectionType = collection.type || "movie";
    if (mediaItem.type !== collectionType) {
      return res.status(400).json({
        message: `Validation failed: Cannot add a ${mediaItem.type} item to a ${collectionType} collection.`,
      });
    }

    if (collection.items.includes(mediaItemId)) {
      return res
        .status(400)
        .json({ message: "Item already exists in this collection" });
    }

    if (!collection.type) {
      collection.type = "movie";
    }
    collection.items.push(mediaItemId);
    await collection.save();

    res.json({ message: "Item added to collection successfully", collection });
  } catch (error) {
    console.error("Error adding item to collection:", error);
    res
      .status(500)
      .json({ message: "Server error while adding item to collection" });
  }
};

// עדכון סדר הפריטים בתוך האוסף
const updateCollectionOrder = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { orderedMediaIds } = req.body;

    if (!Array.isArray(orderedMediaIds)) {
      return res
        .status(400)
        .json({ message: "Expected an array of media IDs" });
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      user: req.user.id,
    });
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    collection.items = orderedMediaIds;
    await collection.save();

    res.json({ message: "Collection order updated successfully", collection });
  } catch (error) {
    console.error("Error updating collection order:", error);
    res
      .status(500)
      .json({ message: "Server error while updating collection order" });
  }
};

// מחיקת אוסף
const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findOneAndDelete({
      _id: collectionId,
      user: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ message: "Server error while deleting collection" });
  }
};

// הסרת פריט בודד מתוך אוסף
const removeMediaFromCollection = async (req, res) => {
  try {
    const { collectionId, mediaId } = req.params;

    const collection = await Collection.findOne({
      _id: collectionId,
      user: req.user.id,
    });
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    collection.items = collection.items.filter(
      (id) => id.toString() !== mediaId,
    );
    await collection.save();

    res.json({
      message: "Item removed from collection successfully",
      collection,
    });
  } catch (error) {
    console.error("Error removing item from collection:", error);
    res
      .status(500)
      .json({ message: "Server error while removing item from collection" });
  }
};

module.exports = {
  createCollection,
  getUserCollections,
  addItemToCollection,
  updateCollectionOrder,
  deleteCollection,
  removeMediaFromCollection,
};

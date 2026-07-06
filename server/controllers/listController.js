const mongoose = require("mongoose"); // <- התיקון הקריטי: ייבוא הספרייה ששכחת!
const MediaItem = require("../models/Item");
const UserList = require("../models/UserList");

// הוספה או עדכון של פריט ברשימת המשתמש
const addOrUpdateListItem = async (req, res) => {
  try {
    const {
      externalId,
      title,
      type,
      posterPath,
      releaseDate,
      duration,
      totalSeasons,
      totalEpisodes,
      episodeRuntime,
      status,
      rating,
      review,
      address,
    } = req.body;

    // הגנה מפני חוסר עקביות במזהה המשתמש
    const userId = req.user._id || req.user.id;

    let media = await MediaItem.findOne({ externalId });

    if (!media) {
      media = await MediaItem.create({
        externalId,
        title,
        type,
        posterPath,
        releaseDate,
        duration,
        totalSeasons,
        totalEpisodes,
        episodeRuntime,
        address,
      });
    }

    const userListItem = await UserList.findOneAndUpdate(
      { user: userId, mediaItem: media._id },
      { status: status || "wishlist", rating, review },
      { new: true, upsert: true },
    ).populate("mediaItem");

    res.status(200).json(userListItem);
  } catch (error) {
    console.error("Error updating list:", error);
    res.status(500).json({ message: "Server error while updating list" });
  }
};

// שליפת הרשימה הממוינת של המשתמש
const getUserList = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const list = await UserList.find({ user: userId })
      .populate("mediaItem")
      .sort({ orderIndex: 1 }); // מיון לפי התור שנשמר

    res.json(list);
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ message: "Server error while fetching list" });
  }
};

// מחיקת פריט מרשימת המשתמש
const removeListItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id || req.user.id;

    const deletedItem = await UserList.findOneAndDelete({
      _id: listId,
      user: userId,
    });

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found in your list" });
    }

    res.status(200).json({
      message: "Item successfully removed from your list",
      id: listId,
    });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ message: "Server error while removing item" });
  }
};

// עדכון סדר הפריטים ברשימה המרכזית (Bulk Update)
const updateUserListOrder = async (req, res) => {
  try {
    const { orderedItems } = req.body;
    const userId = req.user._id || req.user.id;

    if (!Array.isArray(orderedItems)) {
      return res
        .status(400)
        .json({ message: "Invalid data format, expected an array" });
    }

    // בניית פעולת העדכון המרוכזת עם המרה בטוחה ל-ObjectId של מונגו
    const bulkOps = orderedItems
      .map((item) => {
        if (!item._id) return null;

        return {
          updateOne: {
            filter: {
              _id: new mongoose.Types.ObjectId(item._id),
              user: new mongoose.Types.ObjectId(userId),
            },
            update: { $set: { orderIndex: item.orderIndex } },
          },
        };
      })
      .filter((op) => op !== null);

    if (bulkOps.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid items provided for reordering" });
    }

    const result = await UserList.bulkWrite(bulkOps);
    console.log(
      `Successfully reordered ${result.modifiedCount} items in database.`,
    );

    res.json({ message: "List order updated successfully" });
  } catch (error) {
    console.error("Error updating list order in backend:", error.message);
    res.status(500).json({
      message: "Server error while updating list order",
      error: error.message,
    });
  }
};

module.exports = {
  addOrUpdateListItem,
  getUserList,
  removeListItem,
  updateUserListOrder,
};

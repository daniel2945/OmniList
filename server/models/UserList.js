const mongoose = require("mongoose");

const userListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    status: {
      type: String,
      enum: [
        // Game statuses
        "plan_to_play",
        "playing",
        // Movie/TV statuses
        "plan_to_watch",
        "watching",
        // Destination statuses
        "plan_to_visit",
        "visited",
        // Common statuses
        "completed",
        "dropped",
      ],
      required: true,
    },
    rating: { type: Number, min: 1, max: 10 },
    review: { type: String },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// מניעת מצב שמשתמש מוסיף את אותו פריט פעמיים לרשימה שלו
userListSchema.index({ user: 1, mediaItem: 1 }, { unique: true });

module.exports = mongoose.model("UserList", userListSchema);

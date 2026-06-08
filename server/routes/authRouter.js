const express = require("express");
const authRouter = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

// נתיב להרשמה: POST /api/auth/register
authRouter.post("/register", registerUser);

// נתיב להתחברות: POST /api/auth/login
authRouter.post("/login", loginUser);

module.exports = authRouter;

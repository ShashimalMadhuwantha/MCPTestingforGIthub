const express = require("express");
const { login, callback, me } = require("../controllers/authController");
const router = express.Router();

router.get("/", login);            // /auth
router.get("/callback", callback); // /auth/callback
router.get("/me", me);             // /auth/me

module.exports = router;
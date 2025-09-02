const express = require("express");
const { login, callback } = require("../controllers/authController");
const router = express.Router();

router.get("/", login);           // /auth
router.get("/callback", callback); // /auth/callback

module.exports = router;

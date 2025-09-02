const express = require("express");
const { listCommits } = require("../controllers/commitController");
const router = express.Router();

router.get("/:owner/:repo", listCommits);

module.exports = router;

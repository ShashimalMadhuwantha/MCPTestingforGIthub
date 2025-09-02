const express = require("express");
const { listCommits, summarizeCommits } = require("../controllers/commitController");
const router = express.Router();

router.get("/:owner/:repo", listCommits);
router.get("/:owner/:repo/summary", summarizeCommits);

module.exports = router;

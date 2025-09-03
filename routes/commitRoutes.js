const express = require("express");
const { listCommits, summarizeCommits, summarizeCommitsByDate, listCommitsByDate } = require("../controllers/commitController");
const router = express.Router();

// ...existing code...
router.get("/:owner/:repo", listCommits);
router.get("/:owner/:repo/by-date/:date", listCommitsByDate); // added
router.get("/:owner/:repo/summary", summarizeCommits);
router.get("/:owner/:repo/summary/:date", summarizeCommitsByDate);
// ...existing code...

module.exports = router;
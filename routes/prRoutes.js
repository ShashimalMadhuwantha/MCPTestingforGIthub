const express = require("express");
const {
  listPRs,
  summarizeRepoPRs,
  listOpenPRsForOwner,
  summarizeOpenPRsForOwner,
} = require("../controllers/prController");

const router = express.Router();

// Existing: list open PRs for a specific repo
router.get("/:owner/:repo", listPRs);

// New: AI summary for a specific repo's open PRs
router.get("/:owner/:repo/summary", summarizeRepoPRs);

// New: list open PRs across all repos for an owner (org or user)
router.get("/owner/:owner/open", listOpenPRsForOwner);

// New: AI summary of open PRs across all repos for an owner (org or user)
router.get("/owner/:owner/open/summary", summarizeOpenPRsForOwner);

module.exports = router;
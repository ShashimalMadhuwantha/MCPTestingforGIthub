// ...existing code...
const express = require("express");
const {
  listIssues,
  summarizeRepoIssues,
  listOpenIssuesForOwner,
  summarizeOpenIssuesForOwner,
} = require("../controllers/issueController");
const router = express.Router();

router.get("/:owner/:repo", listIssues);
router.get("/:owner/:repo/summary", summarizeRepoIssues);
router.get("/owner/:owner/open", listOpenIssuesForOwner);
router.get("/owner/:owner/open/summary", summarizeOpenIssuesForOwner);

module.exports = router;
// ...existing code...
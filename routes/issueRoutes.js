const express = require("express");
const { listIssues } = require("../controllers/issueController");
const router = express.Router();

router.get("/:owner/:repo", listIssues);

module.exports = router;

const express = require("express");
const { listPRs } = require("../controllers/prController");
const router = express.Router();

router.get("/:owner/:repo", listPRs);

module.exports = router;

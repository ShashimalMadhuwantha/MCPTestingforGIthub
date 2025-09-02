const express = require("express");
const { getRepos } = require("../controllers/repoController");
const router = express.Router();

router.get("/", getRepos);

module.exports = router;

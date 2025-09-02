const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Import routes
const authRoutes = require("./routes/authRoutes");
const repoRoutes = require("./routes/repoRoutes");
const issueRoutes = require("./routes/issueRoutes");
const prRoutes = require("./routes/prRoutes");
const commitRoutes = require("./routes/commitRoutes");

// Use routes
app.use("/auth", authRoutes);
app.use("/repos", repoRoutes);
app.use("/issues", issueRoutes);
app.use("/prs", prRoutes);
app.use("/commits", commitRoutes);

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));

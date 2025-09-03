const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

// CORS: allow your frontend origin (place BEFORE routes)
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); // Express 5: remove this, '*' is invalid
// If you really want explicit OPTIONS handling, use the regex path:
// app.options("/(.*)", cors(corsOptions));

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
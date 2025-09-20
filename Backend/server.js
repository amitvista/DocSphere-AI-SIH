const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

// Route imports
const authRoutes = require("./routes/auth");
const hrRoutes = require("./routes/hrRoutes");
const legalRoutes = require("./routes/legalRoutes");
const engineerRoutes = require("./routes/engineerRoutes");
const financeRoutes = require("./routes/financeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const aiRoutes = require("./routes/ai");  // ✅ AI routes
const ocrRoutes = require("./routes/ocrRoutes");

const app = express();

// ===== Middleware =====
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/engineer", engineerRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);   // ✅ AI chat
app.use("/api/ocr", ocrRoutes);

// ===== Health Check =====
app.get("/", (req, res) => {
  res.json({ message: "🚀 DocSphereAI Backend is running with MongoDB Atlas" });
});

// ===== Connect DB =====
connectDB();

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

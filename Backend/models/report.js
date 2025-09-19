const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  projectId: { type: String, ref: "Project" },
  progress: String,
  incidents: [String],
  improvements: [String],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema, "reports");

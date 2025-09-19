const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  notes: { type: String }, // details hidden unless asked
  status: { type: String, enum: ["Open", "Closed", "Pending"], default: "Open" },
  parties: [String],
  filedDate: Date,
  closedDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Case", caseSchema, "cases");

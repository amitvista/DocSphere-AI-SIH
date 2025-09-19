const mongoose = require("mongoose");

const financeReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["Audit", "Compliance", "Summary"], required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("FinanceReport", financeReportSchema, "finance_reports");

const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String, required: true }, // AI uses by default
  notes: { type: String }, // detailed version (fetched only if asked)
  department: String,
  effectiveDate: Date,
  expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Policy", policySchema, "policies");

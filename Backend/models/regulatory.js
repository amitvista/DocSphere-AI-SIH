const mongoose = require("mongoose");

const regulatorySchema = new mongoose.Schema({
  regulatoryId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  notes: { type: String }, // detailed compliance info
  deadline: Date,
  licenseNumber: String,
  complianceStatus: { type: String, enum: ["Pending", "Compliant", "Expired"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Regulatory", regulatorySchema, "regulatory");

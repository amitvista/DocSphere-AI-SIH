// models/contract.js
const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  contractId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["employee", "vendor"], required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },   // short version AI always uses
  notes: { type: String },                     // extra details (hidden unless asked)
  parties: [String],                           // involved parties
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ["active", "expired", "terminated"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Contract", contractSchema, "contracts");

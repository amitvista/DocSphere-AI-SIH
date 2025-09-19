const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  asset: { type: String, required: true },
  logs: [String],
  schedule: Date,
  issues: [String],
  assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema, "maintenance");

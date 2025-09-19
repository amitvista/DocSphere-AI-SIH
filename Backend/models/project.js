const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  deadlines: Date,
  assignedEngineers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema, "projects");

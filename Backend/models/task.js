const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, ref: "Project" },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  deadlines: Date,
  assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema, "tasks");

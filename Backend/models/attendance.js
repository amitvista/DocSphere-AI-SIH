// models/attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: "Employee" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Leave"], required: true }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema, "attendance");

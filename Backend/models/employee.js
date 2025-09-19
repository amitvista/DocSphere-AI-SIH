// models/employee.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  role: { type: String, required: true }, // Engineer, Finance Officer, etc.
  department: { type: String, required: true },
  dateOfJoining: { type: Date, required: true },
  contact: {
    phone: { type: String },
    email: { type: String }
  },
  emergencyContact: {
    name: { type: String },
    relation: { type: String },
    phone: { type: String }
  },
  address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema, "employees");

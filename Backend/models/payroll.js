// models/payroll.js
const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: "Employee" },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  payDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Payroll", payrollSchema, "payroll");

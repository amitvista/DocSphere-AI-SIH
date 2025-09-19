const mongoose = require("mongoose");

const financePayrollSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: "Employee" },
  salary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  reimbursements: { type: Number, default: 0 },
  slipUrl: { type: String }, // link to PDF/Doc if stored
  payDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("FinancePayroll", financePayrollSchema, "finance_payroll");

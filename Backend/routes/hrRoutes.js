// routes/hrRoutes.js
const express = require("express");
const Employee = require("../models/employee");
const Attendance = require("../models/attendance");
const Payroll = require("../models/payroll");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

// Add new employee (HR or Admin only)
router.post("/employee", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all employees (Admin sees all, HR sees all, others see only self)
router.get("/employees", protect, async (req, res) => {
  let employees;
  if (req.user.role === "admin" || req.user.role === "hr") {
    employees = await Employee.find();
  } else {
    employees = await Employee.find({ employeeId: req.user.employeeId });
  }
  res.json(employees);
});

// Mark attendance (HR or Admin)
router.post("/attendance", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const record = await Attendance.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add payroll entry (HR or Admin)
router.post("/payroll", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const payroll = await Payroll.create(req.body);
    res.status(201).json(payroll);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router; 
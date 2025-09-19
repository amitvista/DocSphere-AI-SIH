const express = require("express");
const Employee = require("../models/employee");
const Contract = require("../models/contract");
const Project = require("../models/project");
const FinanceReport = require("../models/financeReport");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

// Admin Overview Dashboard
router.get("/overview", protect, authorize("admin"), async (req, res) => {
  const employees = await Employee.countDocuments();
  const contracts = await Contract.countDocuments();
  const projects = await Project.countDocuments();
  const financeReports = await FinanceReport.countDocuments();

  res.json({
    employees,
    contracts,
    projects,
    financeReports,
    message: "Admin overview dashboard"
  });
});

// Cross-department: get all employees
router.get("/employees", protect, authorize("admin"), async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

// Cross-department: get all projects
router.get("/projects", protect, authorize("admin"), async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

// Cross-department: get all contracts
router.get("/contracts", protect, authorize("admin"), async (req, res) => {
  const contracts = await Contract.find();
  res.json(contracts);
});

// Cross-department: get all finance reports
router.get("/finance-reports", protect, authorize("admin"), async (req, res) => {
  const reports = await FinanceReport.find();
  res.json(reports);
});

module.exports = router;

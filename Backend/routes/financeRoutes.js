const express = require("express");
const FinancePayroll = require("../models/financePayroll");
const Budget = require("../models/budget");
const Transaction = require("../models/transaction");
const FinanceReport = require("../models/financeReport");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

// ===== Payroll =====
router.get("/payroll", protect, authorize("finance", "admin"), async (req, res) => {
  const payrolls = req.user.role === "admin" ? await FinancePayroll.find() : await FinancePayroll.find({ employeeId: req.user.employeeId });
  res.json(payrolls);
});

router.post("/payroll", protect, authorize("finance", "admin"), async (req, res) => {
  const payroll = await FinancePayroll.create(req.body);
  res.status(201).json(payroll);
});

// ===== Budgets =====
router.get("/budgets", protect, authorize("finance", "admin"), async (req, res) => {
  const budgets = await Budget.find();
  res.json(budgets);
});

router.post("/budgets", protect, authorize("finance", "admin"), async (req, res) => {
  const budget = await Budget.create(req.body);
  res.status(201).json(budget);
});

// ===== Transactions =====
router.get("/transactions", protect, authorize("finance", "admin"), async (req, res) => {
  const transactions = await Transaction.find();
  res.json(transactions);
});

router.post("/transactions", protect, authorize("finance", "admin"), async (req, res) => {
  const transaction = await Transaction.create(req.body);
  res.status(201).json(transaction);
});

// ===== Reports =====
router.get("/reports", protect, authorize("finance", "admin"), async (req, res) => {
  const reports = await FinanceReport.find();
  res.json(reports);
});

router.post("/reports", protect, authorize("finance", "admin"), async (req, res) => {
  const report = await FinanceReport.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(report);
});

module.exports = router;

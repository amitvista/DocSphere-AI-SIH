const express = require("express");
const Project = require("../models/project");
const Task = require("../models/task");
const Maintenance = require("../models/maintenance");
const Report = require("../models/report");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

// ===== Projects =====
router.get("/projects", protect, authorize("engineer", "admin"), async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedEngineers: req.user._id };
  const projects = await Project.find(query);
  res.json(projects);
});

router.post("/projects", protect, authorize("admin"), async (req, res) => {
  const project = await Project.create(req.body);
  res.status(201).json(project);
});

// ===== Tasks =====
router.get("/tasks", protect, authorize("engineer", "admin"), async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedEngineer: req.user._id };
  const tasks = await Task.find(query);
  res.json(tasks);
});

router.post("/tasks", protect, authorize("admin"), async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json(task);
});

// ===== Maintenance =====
router.get("/maintenance", protect, authorize("engineer", "admin"), async (req, res) => {
  const query = req.user.role === "admin" ? {} : { assignedEngineer: req.user._id };
  const records = await Maintenance.find(query);
  res.json(records);
});

router.post("/maintenance", protect, authorize("admin"), async (req, res) => {
  const record = await Maintenance.create(req.body);
  res.status(201).json(record);
});

// ===== Reports =====
router.get("/reports", protect, authorize("engineer", "admin"), async (req, res) => {
  const query = req.user.role === "admin" ? {} : { submittedBy: req.user._id };
  const reports = await Report.find(query);
  res.json(reports);
});

router.post("/reports", protect, authorize("engineer", "admin"), async (req, res) => {
  const report = await Report.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json(report);
});

module.exports = router;

const express = require("express");
const Contract = require("../models/contract");
const Policy = require("../models/policy");
const Case = require("../models/case");
const Regulatory = require("../models/regulatory");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

// ===== Contracts =====
// Get contracts (summary by default)
router.get("/contracts", protect, authorize("legal", "admin"), async (req, res) => {
  const { details } = req.query; // ?details=true
  const contracts = await Contract.find({}, details ? {} : { notes: 0 }); 
  res.json(contracts);
});

// Add contract
router.post("/contracts", protect, authorize("legal", "admin"), async (req, res) => {
  const contract = await Contract.create(req.body);
  res.status(201).json(contract);
});

// ===== Policies =====
router.get("/policies", protect, authorize("legal", "admin"), async (req, res) => {
  const policies = await Policy.find();
  res.json(policies);
});

router.post("/policies", protect, authorize("legal", "admin"), async (req, res) => {
  const policy = await Policy.create(req.body);
  res.status(201).json(policy);
});

// ===== Cases =====
router.get("/cases", protect, authorize("legal", "admin"), async (req, res) => {
  const cases = await Case.find();
  res.json(cases);
});

router.post("/cases", protect, authorize("legal", "admin"), async (req, res) => {
  const legalCase = await Case.create(req.body);
  res.status(201).json(legalCase);
});

// ===== Regulatory =====
router.get("/regulatory", protect, authorize("legal", "admin"), async (req, res) => {
  const regulatoryDocs = await Regulatory.find();
  res.json(regulatoryDocs);
});

router.post("/regulatory", protect, authorize("legal", "admin"), async (req, res) => {
  const doc = await Regulatory.create(req.body);
  res.status(201).json(doc);
});

module.exports = router;

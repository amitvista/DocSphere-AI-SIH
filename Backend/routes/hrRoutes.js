// routes/hrRoutes.js
const express = require("express");
const Employee = require("../models/employee");
const Attendance = require("../models/attendance");
const Payroll = require("../models/payroll");
const OCRResult = require("../models/ocrResult");   // ✅ import OCR model
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const router = express.Router();

/**
 * 📌 1. Upload OCR result for HR validation
 */
router.post("/ocr", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const { rawText, parsedJson, suggestedCollection } = req.body;

    const result = await OCRResult.create({
      rawText,
      parsedJson,
      suggestedCollection,
      uploadedBy: req.user._id
    });

    res.status(201).json({ message: "OCR result uploaded", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 📌 2. Get all OCR results for HR review
 */
router.get("/ocr-results", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const results = await OCRResult.find().populate("uploadedBy", "name role email");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 3. Approve an OCR result → Insert into Employee collection
 */
router.post("/ocr/approve/:id", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    const ocr = await OCRResult.findById(req.params.id);
    if (!ocr) return res.status(404).json({ error: "OCR result not found" });

    // Example: If suggested collection is "employee"
    if (ocr.suggestedCollection === "employee" && ocr.parsedJson) {
      const employee = await Employee.create(ocr.parsedJson);
      return res.json({ message: "OCR approved and added to Employees", employee });
    }

    res.status(400).json({ error: "Unsupported OCR type or missing parsed data" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 4. Reject OCR result
 */
router.delete("/ocr/reject/:id", protect, authorize("hr", "admin"), async (req, res) => {
  try {
    await OCRResult.findByIdAndDelete(req.params.id);
    res.json({ message: "OCR result rejected & removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

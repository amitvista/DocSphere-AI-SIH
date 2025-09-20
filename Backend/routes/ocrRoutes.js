// routes/ocrRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { protect } = require("../middleware/auth");
const authorize = require("../middleware/roles");

const OCRResult = require("../models/ocrResult");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/process",
  protect,
  authorize("hr", "admin"),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = path.resolve(req.file.path);
    const scriptPath = path.resolve(__dirname, "../document_processor.py");

    console.log("📂 File received:", filePath);
    console.log("▶️ Starting Python OCR:", scriptPath);

    try {
      const python = spawn("py", ["-3.13", scriptPath, filePath]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("❌ [PYTHON STDERR]", data.toString());
      });

      python.on("close", async (code) => {
        console.log("📂 OCR script finished");
        console.log("   Exit code:", code);
        console.log("   STDOUT:", stdout);
        console.log("   STDERR:", stderr);

        fs.unlinkSync(filePath); // cleanup uploaded file

        if (code !== 0) {
          return res.status(500).json({
            error: "OCR process failed",
            details: stderr || "Unknown error",
          });
        }

        try {
          // ✅ Always read JSON files from Backend root (not routes/)
          const baseDir = path.resolve(__dirname, "..");
          const resultPath = path.join(baseDir, "processing_result.json");
          const detailsPath = path.join(baseDir, "important_details.json");

          if (!fs.existsSync(resultPath) || !fs.existsSync(detailsPath)) {
            return res.status(500).json({
              error: "OCR JSON output missing",
              details: { resultPath, detailsPath },
            });
          }

          const result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
          const details = JSON.parse(fs.readFileSync(detailsPath, "utf-8"));

          // ✅ Save OCR result in MongoDB
          const saved = await OCRResult.create({
            rawText: result.text,
            parsedJson: details,
            suggestedCollection: details.document_type,
            uploadedBy: req.user._id,
          });

          res.status(201).json({ success: true, data: saved });
        } catch (err) {
          console.error("❌ Failed to parse OCR JSON:", err);
          res.status(500).json({
            error: "Failed to read OCR JSON files",
            details: err.message,
          });
        }
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "OCR execution error", details: err.message });
    }
  }
);

module.exports = router;

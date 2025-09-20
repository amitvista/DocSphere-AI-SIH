// models/ocrResult.js
const mongoose = require("mongoose");

const ocrResultSchema = new mongoose.Schema(
  {
    rawText: { type: String },
    parsedJson: { type: Object },
    suggestedCollection: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OCRResult", ocrResultSchema);
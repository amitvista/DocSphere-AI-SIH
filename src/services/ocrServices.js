// Backend/services/ocrService.js
const { spawn } = require("child_process");
const path = require("path");

async function extract(buffer, contentType) {
  return new Promise((resolve, reject) => {
    try {
      // Save buffer to temp file
      const tempFile = path.join(__dirname, "../uploads/input_file");
      const fs = require("fs");
      fs.writeFileSync(tempFile, buffer);

      // Call Python OCR processor
      const py = spawn("python", [
        path.join(__dirname, "../python/document_processor.py"),
        tempFile,
      ]);

      let output = "";
      py.stdout.on("data", (data) => {
        output += data.toString();
      });

      py.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
      });

      py.on("close", (code) => {
        try {
          const result = JSON.parse(output); // Expect Python to return JSON
          resolve(result);
        } catch (err) {
          reject("Failed to parse OCR output: " + err.message);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { extract };

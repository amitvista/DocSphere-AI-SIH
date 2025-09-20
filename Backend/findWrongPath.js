const fs = require("fs");
const path = require("path");

const target = "ddocument_processor.py";
const baseDir = __dirname; // current Backend folder


function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      searchFiles(fullPath);
    } else if (/\.(js|json)$/i.test(file)) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes(target)) {
        console.log(`🚨 Found in: ${fullPath}`);
      }
    }
  }
}

searchFiles(baseDir);

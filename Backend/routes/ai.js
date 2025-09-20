const express = require("express");
const router = express.Router();
const { queryOllama } = require("../services/aiService");

router.post("/chat", async (req, res) => {
  try {
    const { message, role, topic } = req.body;

    if (!message || !role) {
      return res.status(400).json({ error: "Message and role are required." });
    }

    const reply = await queryOllama(message, role, topic || "General");
    res.json({ reply });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: "AI service failed.", details: err.message });
  }
});

module.exports = router;

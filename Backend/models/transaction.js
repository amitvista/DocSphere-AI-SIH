const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["Payment", "Invoice"], required: true },
  amount: { type: Number, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema, "transactions");

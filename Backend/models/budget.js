const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  budgetId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  project: { type: String },
  allocated: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  remaining: { type: Number, default: function () { return this.allocated - this.spent; } },
  startDate: Date,
  endDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema, "budgets");

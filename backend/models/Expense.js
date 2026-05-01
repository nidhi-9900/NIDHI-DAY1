const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }
});

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0.01 },
  category:    {
    type: String,
    enum: ['food', 'travel', 'shopping', 'entertainment', 'utilities', 'other'],
    default: 'other'
  },
  group:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  paidBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splits:    [splitSchema],
  splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);

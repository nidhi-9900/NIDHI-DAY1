const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '', trim: true },
  members:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalExpense: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);

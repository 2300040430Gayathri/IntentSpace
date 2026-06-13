const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['yes_no', 'range'], default: 'yes_no' },
    unit: { type: String, default: '' },
    target: { type: Number, default: 1 },
    color: { type: String, default: '#2563EB' },
    icon: { type: String, default: '✓' },
    reminderTime: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

habitSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Habit', habitSchema);

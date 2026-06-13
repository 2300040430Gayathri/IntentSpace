const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#4F46E5' },
    icon: { type: String, default: '📚' },
    resources: [{ title: String, url: String, type: String }],
    notes: { type: String, default: '' },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    totalPracticeMinutes: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ user: 1 });

module.exports = mongoose.model('Skill', skillSchema);

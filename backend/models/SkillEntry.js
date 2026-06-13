const mongoose = require('mongoose');

const skillEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    date: { type: Date, required: true },
    topicsLearned: [{ type: String }],
    practiceDone: { type: String, default: '' },
    practiceMinutes: { type: Number, default: 0 },
    mistakes: { type: String, default: '' },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

skillEntrySchema.index({ skill: 1, date: 1 });

module.exports = mongoose.model('SkillEntry', skillEntrySchema);

const mongoose = require('mongoose');

const habitEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    value: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

habitEntrySchema.index({ habit: 1, date: 1 }, { unique: true });
habitEntrySchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('HabitEntry', habitEntrySchema);

const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: {
      type: String,
      enum: ['study', 'coding', 'reading', 'deep_work', 'custom'],
      default: 'study',
    },
    duration: { type: Number, required: true },
    breakDuration: { type: Number, default: 5 },
    completed: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    backgroundSound: { type: String, default: 'none' },
    startedAt: { type: Date, required: true },
    endedAt: Date,
  },
  { timestamps: true }
);

focusSessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);

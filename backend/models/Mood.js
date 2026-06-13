const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    mood: { type: String, enum: ['great', 'good', 'okay', 'low'], required: true },
    note: { type: String, default: '' },
    source: { type: String, enum: ['checkin', 'diary', 'memory', 'manual'], default: 'checkin' },
  },
  { timestamps: true }
);

moodSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Mood', moodSchema);

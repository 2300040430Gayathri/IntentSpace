const mongoose = require('mongoose');

const writingProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    wordCount: { type: Number, default: 0 },
    entryCount: { type: Number, default: 0 },
    scores: {
      overall: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      vocabulary: { type: Number, default: 0 },
      writing: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
    },
    englishLevel: { type: String, default: 'Beginner' },
  },
  { timestamps: true }
);

writingProgressSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WritingProgress', writingProgressSchema);

const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, default: '' },
    content: { type: String, required: true },
    mood: { type: String, enum: ['great', 'good', 'okay', 'low', 'sad'], default: 'good' },
    images: [{ type: String }],
    tags: [{ type: String }],
    aiReflection: { type: String, default: '' },
    englishAnalysis: {
      level: String,
      wordCount: Number,
      scores: {
        overall: Number,
        grammar: Number,
        vocabulary: Number,
        writing: Number,
        communication: Number,
        readability: Number,
        fluency: Number,
        sentenceStructure: Number,
      },
      mistakes: [{ type: { type: String }, text: String, suggestion: String, position: Number }],
      weakSentences: [{ original: String, improved: String }],
      vocabularySuggestions: [String],
      improvedVersion: String,
      correctedVersion: String,
    },
    aiCoach: {
      feedback: String,
      tips: [String],
      goals: [String],
      wordsToLearn: [String],
    },
  },
  { timestamps: true }
);

diarySchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Diary', diarySchema);

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['bug', 'feature', 'ui', 'performance', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'planned', 'completed', 'rejected'],
      default: 'pending',
    },
    screenshot: { type: String, default: '' },
  },
  { timestamps: true }
);

feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, category: 1, priority: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);

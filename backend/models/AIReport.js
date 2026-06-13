const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'daily_summary',
        'weekly_summary',
        'monthly_summary',
        'habit_suggestions',
        'task_prioritization',
        'skill_insights',
        'memory_recap',
        'diary_reflection',
        'focus_coaching',
        'planner_review',
        'motivation',
      ],
      required: true,
    },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    periodStart: Date,
    periodEnd: Date,
  },
  { timestamps: true }
);

aiReportSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('AIReport', aiReportSchema);

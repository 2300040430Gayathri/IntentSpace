const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['pending', 'completed', 'archived'], default: 'pending' },
    deadline: Date,
    tags: [{ type: String, trim: true }],
    order: { type: Number, default: 0 },
    carriedForward: { type: Boolean, default: false },
    completedAt: Date,
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);

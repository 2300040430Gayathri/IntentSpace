const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled', trim: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'General', trim: true },
    pinned: { type: Boolean, default: false },
    color: { type: String, default: '#2563EB' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, updatedAt: -1 });
noteSchema.index({ user: 1, category: 1 });
noteSchema.index({ user: 1, pinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);

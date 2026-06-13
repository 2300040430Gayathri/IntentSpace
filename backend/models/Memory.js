const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'emotional', 'angry', 'neutral'],
      default: 'happy',
    },
    images: [{ type: String }],
    tags: [{ type: String }],
    location: { type: String, default: '' },
  },
  { timestamps: true }
);

memorySchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Memory', memorySchema);

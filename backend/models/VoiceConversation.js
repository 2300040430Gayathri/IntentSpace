const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const voiceConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Voice Session' },
    messages: [messageSchema],
    duration: { type: Number, default: 0 },
    endedAt: Date,
  },
  { timestamps: true }
);

voiceConversationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('VoiceConversation', voiceConversationSchema);

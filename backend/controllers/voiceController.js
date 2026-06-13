const VoiceConversation = require('../models/VoiceConversation');
const asyncHandler = require('../utils/asyncHandler');

const RESPONSES = {
  greeting: [
    "Hello! I'm your IntentSpace voice coach. How are you feeling today?",
    "Hi there! Ready to talk about your goals or practice your English?",
  ],
  english: [
    "That's a great point. Try expressing it with more specific vocabulary next time.",
    "I hear you. Would you like a tip on how to phrase that more naturally in English?",
  ],
  motivation: [
    "You're making progress every day. Keep showing up for yourself.",
    "Small consistent steps lead to big results. I'm proud of your effort.",
  ],
  focus: [
    "When you're ready to focus, try a 25-minute session with no distractions.",
    "Deep work starts with a clear intention. What's your top priority right now?",
  ],
  default: [
    "I understand. Tell me more about what's on your mind.",
    "That's interesting. How does that make you feel?",
    "Thanks for sharing. What would you like to work on next?",
  ],
};

const pickResponse = (input) => {
  const lower = (input || '').toLowerCase();
  if (/hello|hi|hey|good morning|good evening/.test(lower)) return RESPONSES.greeting;
  if (/english|grammar|vocabulary|write|writing/.test(lower)) return RESPONSES.english;
  if (/motivat|tired|stress|hard|difficult/.test(lower)) return RESPONSES.motivation;
  if (/focus|timer|study|work|concentrate/.test(lower)) return RESPONSES.focus;
  return RESPONSES.default;
};

exports.startSession = asyncHandler(async (req, res) => {
  const greeting = RESPONSES.greeting[0];
  const conversation = await VoiceConversation.create({
    user: req.user._id,
    messages: [{ role: 'assistant', content: greeting }],
  });

  res.status(201).json({ success: true, data: conversation });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const conversation = await VoiceConversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

  conversation.messages.push({ role: 'user', content: message });

  const pool = pickResponse(message);
  const reply = pool[Math.floor(Math.random() * pool.length)];
  conversation.messages.push({ role: 'assistant', content: reply });
  await conversation.save();

  res.status(200).json({ success: true, data: { reply, conversation } });
});

exports.endSession = asyncHandler(async (req, res) => {
  const conversation = await VoiceConversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

  conversation.endedAt = new Date();
  conversation.duration = req.body.duration || 0;
  if (req.body.title) conversation.title = req.body.title;
  await conversation.save();

  res.status(200).json({ success: true, data: conversation });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const conversations = await VoiceConversation.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.status(200).json({ success: true, data: conversations });
});

exports.getConversation = asyncHandler(async (req, res) => {
  const conversation = await VoiceConversation.findOne({ _id: req.params.id, user: req.user._id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  res.status(200).json({ success: true, data: conversation });
});

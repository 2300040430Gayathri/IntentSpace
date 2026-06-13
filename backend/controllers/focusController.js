const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { generateFocusCoaching } = require('../services/aiService');

exports.createSession = asyncHandler(async (req, res) => {
  const session = await FocusSession.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: session });
});

exports.completeSession = asyncHandler(async (req, res) => {
  const session = await FocusSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  session.completed = true;
  session.endedAt = new Date();
  session.notes = req.body.notes || session.notes;
  await session.save();

  const user = await User.findById(req.user._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastFocus = user.lastFocusDate ? new Date(user.lastFocusDate) : null;
  if (lastFocus) lastFocus.setHours(0, 0, 0, 0);

  if (!lastFocus || lastFocus.getTime() === today.getTime()) {
    // same day
  } else if (lastFocus.getTime() === today.getTime() - 86400000) {
    user.focusStreak += 1;
  } else {
    user.focusStreak = 1;
  }
  user.lastFocusDate = today;
  await user.save();

  res.status(200).json({ success: true, data: session, focusStreak: user.focusStreak });
});

exports.getSessions = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const query = { user: req.user._id, completed: true };
  const now = new Date();

  if (period === 'daily') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    query.startedAt = { $gte: start };
  } else if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    query.startedAt = { $gte: start };
  } else if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    query.startedAt = { $gte: start };
  }

  const sessions = await FocusSession.find(query).sort({ startedAt: -1 });
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

  res.status(200).json({ success: true, data: sessions, totalMinutes });
});

exports.getStats = asyncHandler(async (req, res) => {
  const sessions = await FocusSession.find({ user: req.user._id, completed: true });
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const user = await User.findById(req.user._id);

  const byMode = sessions.reduce((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + s.duration;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      totalSessions: sessions.length,
      totalMinutes,
      focusStreak: user.focusStreak,
      byMode,
    },
  });
});

exports.getAICoaching = asyncHandler(async (req, res) => {
  const report = await generateFocusCoaching(req.user._id);
  res.status(200).json({ success: true, data: report });
});

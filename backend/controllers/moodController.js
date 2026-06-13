const Mood = require('../models/Mood');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.checkIn = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mood = await Mood.findOneAndUpdate(
    { user: req.user._id, date: today },
    { mood: req.body.mood, note: req.body.note, source: 'checkin' },
    { new: true, upsert: true }
  );

  await User.findByIdAndUpdate(req.user._id, { lastCheckIn: new Date() });

  res.status(200).json({ success: true, data: mood });
});

exports.getMoods = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const query = { user: req.user._id };
  if (start && end) query.date = { $gte: new Date(start), $lte: new Date(end) };

  const moods = await Mood.find(query).sort({ date: -1 });
  res.status(200).json({ success: true, data: moods });
});

exports.getTodayCheckIn = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mood = await Mood.findOne({ user: req.user._id, date: { $gte: today, $lt: tomorrow } });
  const needsCheckIn = !mood && req.user.dailyCheckIn;

  res.status(200).json({ success: true, data: mood, needsCheckIn });
});

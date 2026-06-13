const User = require('../models/User');
const Note = require('../models/Note');
const Diary = require('../models/Diary');
const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');
const WritingProgress = require('../models/WritingProgress');
const asyncHandler = require('../utils/asyncHandler');

const getStartOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

exports.getOverview = asyncHandler(async (req, res) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [totalUsers, activeUsers, totalNotes, totalJournals, totalFocus, totalTasks] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLogin: { $gte: weekAgo } }),
    Note.countDocuments(),
    Diary.countDocuments(),
    FocusSession.countDocuments({ completed: true }),
    Task.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: { totalUsers, activeUsers, totalNotes, totalJournals, totalFocus, totalTasks },
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role createdAt lastLogin englishLevel writingStats isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

exports.getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const [notes, journals, focusSessions, tasks] = await Promise.all([
    Note.countDocuments({ user: user._id }),
    Diary.countDocuments({ user: user._id }),
    FocusSession.countDocuments({ user: user._id, completed: true }),
    Task.countDocuments({ user: user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: { user, stats: { notes, journals, focusSessions, tasks } },
  });
});

exports.getAnalytics = asyncHandler(async (req, res) => {
  const days = 30;
  const userGrowth = [];
  const journalStats = [];
  const englishStats = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = getStartOfDay(new Date());
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const [users, journals, progress] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: dayEnd } }),
      Diary.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
      WritingProgress.aggregate([
        { $match: { date: { $gte: dayStart, $lte: dayEnd } } },
        { $group: { _id: null, avgScore: { $avg: '$scores.overall' } } },
      ]),
    ]);

    userGrowth.push({ date: dayStart.toISOString().slice(0, 10), count: users });
    journalStats.push({ date: dayStart.toISOString().slice(0, 10), count: journals });
    englishStats.push({
      date: dayStart.toISOString().slice(0, 10),
      avgScore: Math.round(progress[0]?.avgScore || 0),
    });
  }

  const focusByDay = await FocusSession.aggregate([
    { $match: { completed: true, startedAt: { $gte: new Date(Date.now() - days * 86400000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
        minutes: { $sum: '$duration' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      userGrowth,
      journalStats,
      englishStats,
      focusByDay: focusByDay.map((f) => ({ date: f._id, minutes: f.minutes })),
    },
  });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  res.status(200).json({ success: true, data: user });
});

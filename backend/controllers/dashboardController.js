const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const Memory = require('../models/Memory');
const Skill = require('../models/Skill');
const Mood = require('../models/Mood');
const asyncHandler = require('../utils/asyncHandler');
const { generateDailySummary } = require('../services/aiService');

exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    habits,
    habitEntriesToday,
    todayTasks,
    focusToday,
    recentMemories,
    skills,
    todayMood,
    aiSummary,
  ] = await Promise.all([
    Habit.find({ user: req.user._id, isActive: true }).limit(5),
    HabitEntry.find({ user: req.user._id, date: { $gte: today, $lt: tomorrow } }),
    Task.find({ user: req.user._id, status: 'pending' }).sort({ priority: 1 }).limit(5),
    FocusSession.find({ user: req.user._id, startedAt: { $gte: today, $lt: tomorrow }, completed: true }),
    Memory.find({ user: req.user._id }).sort({ date: -1 }).limit(3),
    Skill.find({ user: req.user._id, isActive: true }).limit(4),
    Mood.findOne({ user: req.user._id, date: { $gte: today, $lt: tomorrow } }),
    generateDailySummary(req.user._id).catch(() => null),
  ]);

  const habitStreaks = habits.map((h) => ({
    name: h.name,
    icon: h.icon,
    color: h.color,
    currentStreak: h.currentStreak,
    completedToday: habitEntriesToday.some((e) => e.habit.toString() === h._id.toString() && e.completed),
  }));

  const focusMinutes = focusToday.reduce((sum, s) => sum + s.duration, 0);

  res.status(200).json({
    success: true,
    data: {
      habitStreaks,
      todayTasks,
      focusMinutes,
      focusSessions: focusToday.length,
      recentMemories,
      skills: skills.map((s) => ({
        name: s.name,
        icon: s.icon,
        color: s.color,
        currentStreak: s.currentStreak,
        progress: Math.min(100, s.totalPracticeMinutes / 10),
      })),
      todayMood,
      aiSummary: aiSummary?.content || '',
    },
  });
});

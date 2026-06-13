const HabitEntry = require('../models/HabitEntry');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const Mood = require('../models/Mood');
const Memory = require('../models/Memory');
const SkillEntry = require('../models/SkillEntry');
const asyncHandler = require('../utils/asyncHandler');

exports.getInsights = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const now = new Date();
  let start = new Date();

  if (period === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'monthly') {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setDate(start.getDate() - 30);
  }

  const [
    habitEntries,
    tasksCompleted,
    tasksPending,
    focusSessions,
    moods,
    memories,
    skillEntries,
  ] = await Promise.all([
    HabitEntry.find({ user: req.user._id, date: { $gte: start }, completed: true }),
    Task.countDocuments({ user: req.user._id, status: 'completed', completedAt: { $gte: start } }),
    Task.countDocuments({ user: req.user._id, status: 'pending' }),
    FocusSession.find({ user: req.user._id, startedAt: { $gte: start }, completed: true }),
    Mood.find({ user: req.user._id, date: { $gte: start } }),
    Memory.countDocuments({ user: req.user._id, date: { $gte: start } }),
    SkillEntry.find({ user: req.user._id, date: { $gte: start }, completed: true }),
  ]);

  const focusByDay = {};
  focusSessions.forEach((s) => {
    const day = new Date(s.startedAt).toISOString().split('T')[0];
    focusByDay[day] = (focusByDay[day] || 0) + s.duration;
  });

  const moodCounts = moods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});

  const habitByDay = {};
  habitEntries.forEach((e) => {
    const day = new Date(e.date).toISOString().split('T')[0];
    habitByDay[day] = (habitByDay[day] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      habits: { total: habitEntries.length, byDay: habitByDay },
      tasks: { completed: tasksCompleted, pending: tasksPending },
      focus: {
        totalMinutes: focusSessions.reduce((s, f) => s + f.duration, 0),
        sessions: focusSessions.length,
        byDay: focusByDay,
      },
      moods: moodCounts,
      memories: { count: memories },
      skills: { practiceSessions: skillEntries.length },
    },
  });
});

const HabitEntry = require('../models/HabitEntry');

const calculateStreaks = async (habitId) => {
  const entries = await HabitEntry.find({ habit: habitId, completed: true })
    .sort({ date: -1 })
    .lean();

  if (!entries.length) return { currentStreak: 0, bestStreak: 0 };

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = entries.map((e) => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      const diff = (today.getTime() - uniqueDates[i]) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        tempStreak = 1;
        currentStreak = 1;
      }
    } else {
      const dayDiff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        tempStreak++;
        if (i < 2 || currentStreak > 0) currentStreak = tempStreak;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { currentStreak, bestStreak };
};

const getCompletionRate = async (habitId, days = 30) => {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const entries = await HabitEntry.find({
    habit: habitId,
    date: { $gte: start },
  });

  const completed = entries.filter((e) => e.completed).length;
  return Math.round((completed / days) * 100);
};

module.exports = { calculateStreaks, getCompletionRate };

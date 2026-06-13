const Habit = require('../models/Habit');
const HabitEntry = require('../models/HabitEntry');
const asyncHandler = require('../utils/asyncHandler');
const { calculateStreaks, getCompletionRate } = require('../utils/habitUtils');

exports.getHabits = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id, isActive: true }).sort('order');
  const enriched = await Promise.all(
    habits.map(async (habit) => {
      const completionRate = await getCompletionRate(habit._id);
      return { ...habit.toObject(), completionRate };
    })
  );
  res.status(200).json({ success: true, data: enriched });
});

exports.createHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: habit });
});

exports.updateHabit = asyncHandler(async (req, res) => {
  let habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
  if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

  habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: habit });
});

exports.deleteHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
  if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

  habit.isActive = false;
  await habit.save();
  res.status(200).json({ success: true, message: 'Habit deleted' });
});

exports.getHabitEntries = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const query = { habit: req.params.id, user: req.user._id };
  if (start && end) {
    query.date = { $gte: new Date(start), $lte: new Date(end) };
  }
  const entries = await HabitEntry.find(query).sort({ date: -1 });
  res.status(200).json({ success: true, data: entries });
});

exports.upsertHabitEntry = asyncHandler(async (req, res) => {
  const { date, completed, value, note } = req.body;
  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);

  const entry = await HabitEntry.findOneAndUpdate(
    { habit: req.params.id, user: req.user._id, date: entryDate },
    { completed, value, note, habit: req.params.id, user: req.user._id, date: entryDate },
    { new: true, upsert: true, runValidators: true }
  );

  const streaks = await calculateStreaks(req.params.id);
  await Habit.findByIdAndUpdate(req.params.id, streaks);

  res.status(200).json({ success: true, data: entry, streaks });
});

exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const habits = await Habit.find({ user: req.user._id, isActive: true });
  const report = await Promise.all(
    habits.map(async (habit) => {
      const entries = await HabitEntry.find({
        habit: habit._id,
        date: { $gte: start, $lte: end },
      });
      const completed = entries.filter((e) => e.completed).length;
      const daysInMonth = end.getDate();
      return {
        habit: habit.name,
        completed,
        total: daysInMonth,
        percentage: Math.round((completed / daysInMonth) * 100),
        currentStreak: habit.currentStreak,
        bestStreak: habit.bestStreak,
      };
    })
  );

  res.status(200).json({ success: true, data: report });
});

exports.autoMarkMissed = asyncHandler(async (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const habits = await Habit.find({ user: req.user._id, isActive: true });
  for (const habit of habits) {
    const existing = await HabitEntry.findOne({ habit: habit._id, date: yesterday });
    if (!existing) {
      await HabitEntry.create({
        habit: habit._id,
        user: req.user._id,
        date: yesterday,
        completed: false,
        value: 0,
      });
    }
  }

  res.status(200).json({ success: true, message: 'Missed habits marked' });
});

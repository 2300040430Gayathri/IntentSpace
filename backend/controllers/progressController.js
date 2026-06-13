const WritingProgress = require('../models/WritingProgress');
const Diary = require('../models/Diary');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const getStartOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const updateUserStreaks = async (user, entryDate) => {
  const today = getStartOfDay(entryDate);
  const stats = user.writingStats || {};
  const lastJournal = stats.lastJournalDate ? getStartOfDay(stats.lastJournalDate) : null;

  if (!lastJournal) {
    stats.dailyStreak = 1;
  } else if (lastJournal.getTime() === today.getTime()) {
    // same day, no streak change
  } else if (lastJournal.getTime() === today.getTime() - 86400000) {
    stats.dailyStreak = (stats.dailyStreak || 0) + 1;
  } else {
    stats.dailyStreak = 1;
  }

  stats.lastJournalDate = today;
  stats.totalEntries = (stats.totalEntries || 0) + 1;
  user.writingStats = stats;
  await user.save();
  return stats;
};

exports.recordProgress = async (userId, analysis, wordCount, isNewEntry = true) => {
  const today = getStartOfDay();
  const user = await User.findById(userId);
  if (!user) return null;

  const stats = user.writingStats || {};
  if (isNewEntry) {
    stats.totalWords = (stats.totalWords || 0) + wordCount;
    if (!stats.baselineScore && analysis.scores.overall) {
      stats.baselineScore = analysis.scores.overall;
    }
    await updateUserStreaks(user, today);
  }
  stats.currentScore = analysis.scores.overall;
  if (stats.baselineScore) {
    stats.improvementPct = Math.round(
      ((stats.currentScore - stats.baselineScore) / Math.max(stats.baselineScore, 1)) * 100
    );
  }
  user.writingStats = stats;
  user.englishLevel = analysis.level;
  await user.save();

  await WritingProgress.findOneAndUpdate(
    { user: userId, date: today },
    {
      ...(isNewEntry ? { $inc: { wordCount, entryCount: 1 } } : { $set: { wordCount } }),
      $set: {
        scores: {
          overall: analysis.scores.overall,
          grammar: analysis.scores.grammar,
          vocabulary: analysis.scores.vocabulary,
          writing: analysis.scores.writing,
          communication: analysis.scores.communication,
        },
        englishLevel: analysis.level,
      },
    },
    { upsert: true, new: true }
  );

  return user;
};

exports.getDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [weekly, monthly] = await Promise.all([
    WritingProgress.find({ user: req.user._id, date: { $gte: weekAgo } }).sort({ date: 1 }),
    WritingProgress.find({ user: req.user._id, date: { $gte: monthAgo } }).sort({ date: 1 }),
  ]);

  const weeklyStreak = weekly.filter((d) => d.entryCount > 0).length;
  const monthlyStreak = monthly.filter((d) => d.entryCount > 0).length;

  res.status(200).json({
    success: true,
    data: {
      englishLevel: user.englishLevel,
      improvementPct: user.writingStats?.improvementPct || 0,
      dailyStreak: user.writingStats?.dailyStreak || 0,
      weeklyStreak,
      monthlyStreak,
      totalEntries: user.writingStats?.totalEntries || 0,
      totalWords: user.writingStats?.totalWords || 0,
      currentScore: user.writingStats?.currentScore || 0,
      baselineScore: user.writingStats?.baselineScore || 0,
      weeklyGraph: weekly.map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        score: d.scores?.overall || 0,
        words: d.wordCount,
      })),
      monthlyGraph: monthly.map((d) => ({
        date: d.date.toISOString().slice(0, 10),
        score: d.scores?.overall || 0,
        words: d.wordCount,
      })),
      trends: {
        grammar: weekly.length ? Math.round(weekly.reduce((s, d) => s + (d.scores?.grammar || 0), 0) / weekly.length) : 0,
        vocabulary: weekly.length ? Math.round(weekly.reduce((s, d) => s + (d.scores?.vocabulary || 0), 0) / weekly.length) : 0,
        writing: weekly.length ? Math.round(weekly.reduce((s, d) => s + (d.scores?.writing || 0), 0) / weekly.length) : 0,
        communication: weekly.length
          ? Math.round(weekly.reduce((s, d) => s + (d.scores?.communication || 0), 0) / weekly.length)
          : 0,
      },
    },
  });
});

exports.getTimeline = asyncHandler(async (req, res) => {
  const entries = await Diary.find({ user: req.user._id })
    .select('title date mood englishAnalysis.level englishAnalysis.scores aiCoach createdAt')
    .sort({ date: -1 })
    .limit(50);

  res.status(200).json({ success: true, data: entries });
});

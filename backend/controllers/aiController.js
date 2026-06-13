const AIReport = require('../models/AIReport');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateDailySummary,
  generateWeeklySummary,
  generateHabitSuggestions,
  generateTaskPrioritization,
  generateMotivation,
} = require('../services/aiService');

exports.getReports = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const query = { user: req.user._id };
  if (type) query.type = type;

  const reports = await AIReport.find(query).sort({ createdAt: -1 }).limit(20);
  res.status(200).json({ success: true, data: reports });
});

exports.generate = asyncHandler(async (req, res) => {
  const { type } = req.body;
  let report;

  switch (type) {
    case 'daily_summary':
      report = await generateDailySummary(req.user._id);
      break;
    case 'weekly_summary':
      report = await generateWeeklySummary(req.user._id);
      break;
    case 'habit_suggestions':
      report = await generateHabitSuggestions(req.user._id);
      break;
    case 'task_prioritization':
      report = await generateTaskPrioritization(req.user._id);
      break;
    case 'motivation':
      report = await generateMotivation(req.user._id);
      break;
    default:
      return res.status(400).json({ success: false, message: 'Invalid report type' });
  }

  res.status(201).json({ success: true, data: report });
});

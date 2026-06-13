const Diary = require('../models/Diary');
const asyncHandler = require('../utils/asyncHandler');
const { generateDiaryReflection } = require('../services/aiService');
const { analyzeEnglish } = require('../services/englishAnalyzer');
const { recordProgress } = require('../controllers/progressController');

const applyAnalysis = async (entry, userId, isNewEntry = true) => {
  const analysis = analyzeEnglish(entry.content);
  entry.englishAnalysis = {
    level: analysis.level,
    wordCount: analysis.wordCount,
    scores: analysis.scores,
    mistakes: analysis.mistakes,
    weakSentences: analysis.weakSentences,
    vocabularySuggestions: analysis.vocabularySuggestions,
    improvedVersion: analysis.improvedVersion,
    correctedVersion: analysis.correctedVersion,
  };
  entry.aiCoach = analysis.coach;
  await recordProgress(userId, analysis, analysis.wordCount, isNewEntry);
  return analysis;
};

exports.getEntries = asyncHandler(async (req, res) => {
  const { start, end, search } = req.query;
  const query = { user: req.user._id };

  if (start && end) query.date = { $gte: new Date(start), $lte: new Date(end) };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const entries = await Diary.find(query).sort({ date: -1 });
  res.status(200).json({ success: true, data: entries });
});

exports.getEntry = asyncHandler(async (req, res) => {
  const entry = await Diary.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
  res.status(200).json({ success: true, data: entry });
});

exports.createEntry = asyncHandler(async (req, res) => {
  const entry = await Diary.create({ ...req.body, user: req.user._id });
  await applyAnalysis(entry, req.user._id, true);
  const reflection = await generateDiaryReflection(req.user._id, entry.content, entry.mood);
  entry.aiReflection = reflection.content;
  await entry.save();
  res.status(201).json({ success: true, data: entry });
});

exports.updateEntry = asyncHandler(async (req, res) => {
  let entry = await Diary.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

  entry = await Diary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  if (req.body.content) {
    await applyAnalysis(entry, req.user._id, false);
    const reflection = await generateDiaryReflection(req.user._id, entry.content, entry.mood);
    entry.aiReflection = reflection.content;
    await entry.save();
  }

  res.status(200).json({ success: true, data: entry });
});

exports.autoSaveEntry = asyncHandler(async (req, res) => {
  const { id, ...data } = req.body;

  if (id) {
    let entry = await Diary.findOne({ _id: id, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    Object.assign(entry, data);
    await entry.save();
    return res.status(200).json({ success: true, data: entry });
  }

  const entry = await Diary.create({ ...data, user: req.user._id });
  res.status(201).json({ success: true, data: entry });
});

exports.analyzeEntry = asyncHandler(async (req, res) => {
  const entry = await Diary.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

  const analysis = await applyAnalysis(entry, req.user._id);
  await entry.save();
  res.status(200).json({ success: true, data: { entry, analysis } });
});

exports.deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Diary.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
  await entry.deleteOne();
  res.status(200).json({ success: true, message: 'Entry deleted' });
});

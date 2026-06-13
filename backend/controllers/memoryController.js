const Memory = require('../models/Memory');
const asyncHandler = require('../utils/asyncHandler');
const { generateMemoryRecap } = require('../services/aiService');

exports.getMemories = asyncHandler(async (req, res) => {
  const { start, end, mood } = req.query;
  const query = { user: req.user._id };
  if (start && end) query.date = { $gte: new Date(start), $lte: new Date(end) };
  if (mood) query.mood = mood;

  const memories = await Memory.find(query).sort({ date: -1 });
  res.status(200).json({ success: true, data: memories });
});

exports.getOnThisDay = asyncHandler(async (req, res) => {
  const today = new Date();
  const memories = await Memory.find({ user: req.user._id }).sort({ date: -1 });

  const onThisDay = memories.filter((m) => {
    const d = new Date(m.date);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() !== today.getFullYear();
  });

  res.status(200).json({ success: true, data: onThisDay });
});

exports.createMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: memory });
});

exports.updateMemory = asyncHandler(async (req, res) => {
  let memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

  memory = await Memory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: memory });
});

exports.deleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findOne({ _id: req.params.id, user: req.user._id });
  if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });
  await memory.deleteOne();
  res.status(200).json({ success: true, message: 'Memory deleted' });
});

exports.getRecap = asyncHandler(async (req, res) => {
  const { month, year, type } = req.query;
  const report = await generateMemoryRecap(req.user._id, parseInt(month), parseInt(year));
  res.status(200).json({ success: true, data: report });
});

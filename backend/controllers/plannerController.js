const Planner = require('../models/Planner');
const asyncHandler = require('../utils/asyncHandler');
const { generatePlannerReview } = require('../services/aiService');

const getDateOnly = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.getPlanner = asyncHandler(async (req, res) => {
  const date = getDateOnly(req.query.date || new Date());
  let planner = await Planner.findOne({ user: req.user._id, date });

  if (!planner) {
    planner = await Planner.create({ user: req.user._id, date, blocks: [] });
  }

  const completed = planner.blocks.filter((b) => b.completed).length;
  const total = planner.blocks.length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  res.status(200).json({ success: true, data: { ...planner.toObject(), completionRate } });
});

exports.addBlock = asyncHandler(async (req, res) => {
  const date = getDateOnly(req.body.date || new Date());
  let planner = await Planner.findOne({ user: req.user._id, date });

  if (!planner) {
    planner = await Planner.create({ user: req.user._id, date, blocks: [] });
  }

  planner.blocks.push(req.body);
  await planner.save();
  res.status(201).json({ success: true, data: planner });
});

exports.updateBlock = asyncHandler(async (req, res) => {
  const planner = await Planner.findOne({ user: req.user._id, _id: req.params.plannerId });
  if (!planner) return res.status(404).json({ success: false, message: 'Planner not found' });

  const block = planner.blocks.id(req.params.blockId);
  if (!block) return res.status(404).json({ success: false, message: 'Block not found' });

  Object.assign(block, req.body);
  await planner.save();
  res.status(200).json({ success: true, data: planner });
});

exports.deleteBlock = asyncHandler(async (req, res) => {
  const planner = await Planner.findOne({ user: req.user._id, _id: req.params.plannerId });
  if (!planner) return res.status(404).json({ success: false, message: 'Planner not found' });

  planner.blocks.pull(req.params.blockId);
  await planner.save();
  res.status(200).json({ success: true, data: planner });
});

exports.reorderBlocks = asyncHandler(async (req, res) => {
  const planner = await Planner.findOne({ user: req.user._id, _id: req.params.plannerId });
  if (!planner) return res.status(404).json({ success: false, message: 'Planner not found' });

  const { blocks } = req.body;
  blocks.forEach((b) => {
    const block = planner.blocks.id(b.id);
    if (block) block.order = b.order;
  });
  planner.blocks.sort((a, b) => a.order - b.order);
  await planner.save();
  res.status(200).json({ success: true, data: planner });
});

exports.getAIReview = asyncHandler(async (req, res) => {
  const date = getDateOnly(req.query.date || new Date());
  const planner = await Planner.findOne({ user: req.user._id, date });
  const report = await generatePlannerReview(req.user._id, planner?.blocks || []);
  res.status(200).json({ success: true, data: report });
});

const Skill = require('../models/Skill');
const SkillEntry = require('../models/SkillEntry');
const asyncHandler = require('../utils/asyncHandler');
const { generateSkillInsights } = require('../services/aiService');

exports.getSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id, isActive: true });
  res.status(200).json({ success: true, data: skills });
});

exports.getSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

  const entries = await SkillEntry.find({ skill: skill._id }).sort({ date: -1 }).limit(30);
  const totalEntries = await SkillEntry.countDocuments({ skill: skill._id, completed: true });
  const progress = Math.min(100, totalEntries * 2);

  res.status(200).json({ success: true, data: { ...skill.toObject(), entries, progress } });
});

exports.createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: skill });
});

exports.updateSkill = asyncHandler(async (req, res) => {
  let skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

  skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: skill });
});

exports.deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
  if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
  skill.isActive = false;
  await skill.save();
  res.status(200).json({ success: true, message: 'Skill deleted' });
});

exports.addEntry = asyncHandler(async (req, res) => {
  const entryDate = new Date(req.body.date);
  entryDate.setHours(0, 0, 0, 0);

  const entry = await SkillEntry.create({
    ...req.body,
    skill: req.params.id,
    user: req.user._id,
    date: entryDate,
  });

  if (req.body.completed) {
    const skill = await Skill.findById(req.params.id);
    skill.currentStreak += 1;
    skill.bestStreak = Math.max(skill.bestStreak, skill.currentStreak);
    skill.totalPracticeMinutes += req.body.practiceMinutes || 0;
    await skill.save();
  }

  res.status(201).json({ success: true, data: entry });
});

exports.getEntries = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const query = { skill: req.params.id, user: req.user._id };
  if (start && end) query.date = { $gte: new Date(start), $lte: new Date(end) };

  const entries = await SkillEntry.find(query).sort({ date: -1 });
  res.status(200).json({ success: true, data: entries });
});

exports.getAIInsights = asyncHandler(async (req, res) => {
  const report = await generateSkillInsights(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: report });
});

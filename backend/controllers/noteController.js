const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Note = require('../models/Note');

exports.getNotes = asyncHandler(async (req, res) => {
  const { search, category, date } = req.query;
  const query = { user: req.user._id };

  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.updatedAt = { $gte: start, $lte: end };
  }

  const notes = await Note.find(query).sort({ pinned: -1, updatedAt: -1 });
  res.status(200).json({ success: true, data: notes });
});

exports.getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  res.status(200).json({ success: true, data: note });
});

exports.createNote = asyncHandler(async (req, res) => {
  const note = await Note.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: note });
});

exports.updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

  note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: note });
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
  await note.deleteOne();
  res.status(200).json({ success: true, message: 'Note deleted' });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Note.distinct('category', { user: req.user._id });
  res.status(200).json({ success: true, data: categories.length ? categories : ['General'] });
});

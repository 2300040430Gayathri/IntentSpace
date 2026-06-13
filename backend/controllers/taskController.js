const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

exports.getTasks = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const tasks = await Task.find(query).sort({ order: 1, createdAt: -1 });
  res.status(200).json({ success: true, data: tasks });
});

exports.createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: task });
});

exports.updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  if (req.body.status === 'completed') req.body.completedAt = new Date();
  task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted' });
});

exports.reorderTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  await Promise.all(
    tasks.map((t) => Task.findOneAndUpdate({ _id: t.id, user: req.user._id }, { order: t.order }))
  );
  res.status(200).json({ success: true, message: 'Tasks reordered' });
});

exports.carryForward = asyncHandler(async (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const pendingTasks = await Task.find({
    user: req.user._id,
    status: 'pending',
    deadline: { $lte: yesterday },
    carriedForward: false,
  });

  await Task.updateMany(
    { _id: { $in: pendingTasks.map((t) => t._id) } },
    { carriedForward: true, deadline: new Date() }
  );

  res.status(200).json({ success: true, count: pendingTasks.length });
});

exports.getStats = asyncHandler(async (req, res) => {
  const [pending, completed, archived] = await Promise.all([
    Task.countDocuments({ user: req.user._id, status: 'pending' }),
    Task.countDocuments({ user: req.user._id, status: 'completed' }),
    Task.countDocuments({ user: req.user._id, status: 'archived' }),
  ]);

  res.status(200).json({ success: true, data: { pending, completed, archived } });
});

const Feedback = require('../models/Feedback');
const asyncHandler = require('../utils/asyncHandler');

exports.createFeedback = asyncHandler(async (req, res) => {
  const { title, description, category, priority, screenshot } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category: category || 'general',
    priority: priority || 'medium',
    screenshot: screenshot || '',
  });

  const populated = await Feedback.findById(feedback._id).populate('user', 'name email');
  res.status(201).json({ success: true, data: populated });
});

exports.getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('-screenshot');
  res.status(200).json({ success: true, data: feedback });
});

exports.getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({ _id: req.params.id, user: req.user._id });
  if (!feedback) {
    return res.status(404).json({ success: false, message: 'Feedback not found' });
  }
  res.status(200).json({ success: true, data: feedback });
});

exports.getAllFeedback = asyncHandler(async (req, res) => {
  const { search, category, status, priority, page = 1, limit = 20 } = req.query;
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Feedback.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Feedback.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

exports.updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in_review', 'planned', 'completed', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('user', 'name email');

  if (!feedback) {
    return res.status(404).json({ success: false, message: 'Feedback not found' });
  }

  res.status(200).json({ success: true, data: feedback });
});

exports.getFeedbackAnalytics = asyncHandler(async (req, res) => {
  const [total, byStatus, byCategory, featureRequests, bugReports, trends] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Feedback.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Feedback.find({ category: 'feature' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status priority createdAt'),
    Feedback.find({ category: 'bug' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status priority createdAt'),
    Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byCategory: byCategory.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      featureRequests,
      bugReports,
      trends: trends.map((t) => ({ date: t._id, count: t.count })),
    },
  });
});

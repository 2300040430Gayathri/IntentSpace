const express = require('express');
const { getOverview, getUsers, getUserDetails, getAnalytics, updateUserRole } = require('../controllers/adminController');
const {
  getAllFeedback,
  updateFeedbackStatus,
  getFeedbackAnalytics,
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect(), authorize('admin'));

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.get('/analytics', getAnalytics);
router.get('/feedback/analytics', getFeedbackAnalytics);
router.get('/feedback', getAllFeedback);
router.put('/feedback/:id/status', updateFeedbackStatus);

module.exports = router;

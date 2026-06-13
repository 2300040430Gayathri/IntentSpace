const express = require('express');
const {
  createFeedback,
  getMyFeedback,
  getFeedbackById,
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect());

router.post('/', createFeedback);
router.get('/', getMyFeedback);
router.get('/:id', getFeedbackById);

module.exports = router;

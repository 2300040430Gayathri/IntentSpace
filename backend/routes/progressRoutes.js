const express = require('express');
const { getDashboard, getTimeline } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect());

router.get('/dashboard', getDashboard);
router.get('/timeline', getTimeline);

module.exports = router;

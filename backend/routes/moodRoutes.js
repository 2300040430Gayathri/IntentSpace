const express = require('express');
const { checkIn, getMoods, getTodayCheckIn } = require('../controllers/moodController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getMoods);
router.get('/today', getTodayCheckIn);
router.post('/checkin', checkIn);

module.exports = router;

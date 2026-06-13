const express = require('express');
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitEntries,
  upsertHabitEntry,
  getMonthlyReport,
  autoMarkMissed,
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getHabits);
router.get('/report/monthly', getMonthlyReport);
router.post('/auto-mark', autoMarkMissed);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.get('/:id/entries', getHabitEntries);
router.post('/:id/entries', upsertHabitEntry);

module.exports = router;

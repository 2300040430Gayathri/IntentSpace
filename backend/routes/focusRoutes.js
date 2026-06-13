const express = require('express');
const {
  createSession,
  completeSession,
  getSessions,
  getStats,
  getAICoaching,
} = require('../controllers/focusController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getSessions);
router.get('/stats', getStats);
router.get('/ai-coaching', getAICoaching);
router.post('/', createSession);
router.put('/:id/complete', completeSession);

module.exports = router;

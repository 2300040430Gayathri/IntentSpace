const express = require('express');
const {
  startSession,
  sendMessage,
  endSession,
  getHistory,
  getConversation,
} = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect());

router.post('/start', startSession);
router.get('/history', getHistory);
router.get('/:id', getConversation);
router.post('/:id/message', sendMessage);
router.put('/:id/end', endSession);

module.exports = router;

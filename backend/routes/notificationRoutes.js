const express = require('express');
const {
  getNotifications,
  markRead,
  markAllRead,
  createNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.post('/', createNotification);

module.exports = router;

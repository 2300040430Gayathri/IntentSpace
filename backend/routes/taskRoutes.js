const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  carryForward,
  getStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getTasks);
router.get('/stats', getStats);
router.post('/', createTask);
router.put('/reorder', reorderTasks);
router.post('/carry-forward', carryForward);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;

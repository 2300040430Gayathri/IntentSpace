const express = require('express');
const {
  getMemories,
  getOnThisDay,
  createMemory,
  updateMemory,
  deleteMemory,
  getRecap,
} = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getMemories);
router.get('/on-this-day', getOnThisDay);
router.get('/recap', getRecap);
router.post('/', createMemory);
router.put('/:id', updateMemory);
router.delete('/:id', deleteMemory);

module.exports = router;

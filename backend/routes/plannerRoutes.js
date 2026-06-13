const express = require('express');
const {
  getPlanner,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
  getAIReview,
} = require('../controllers/plannerController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getPlanner);
router.get('/ai-review', getAIReview);
router.post('/blocks', addBlock);
router.put('/:plannerId/blocks/:blockId', updateBlock);
router.delete('/:plannerId/blocks/:blockId', deleteBlock);
router.put('/:plannerId/reorder', reorderBlocks);

module.exports = router;

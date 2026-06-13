const express = require('express');
const {
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  addEntry,
  getEntries,
  getAIInsights,
} = require('../controllers/skillController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getSkills);
router.post('/', createSkill);
router.get('/:id', getSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);
router.get('/:id/entries', getEntries);
router.post('/:id/entries', addEntry);
router.get('/:id/ai-insights', getAIInsights);

module.exports = router;

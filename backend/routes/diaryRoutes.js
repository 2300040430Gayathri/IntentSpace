const express = require('express');
const {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  autoSaveEntry,
  analyzeEntry,
  deleteEntry,
} = require('../controllers/diaryController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.post('/autosave', autoSaveEntry);
router.get('/', getEntries);
router.get('/:id', getEntry);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.post('/:id/analyze', analyzeEntry);
router.delete('/:id', deleteEntry);

module.exports = router;

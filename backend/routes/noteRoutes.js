const express = require('express');
const { getNotes, getNote, createNote, updateNote, deleteNote, getCategories } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect());

router.get('/categories/list', getCategories);
router.route('/').get(getNotes).post(createNote);
router.route('/:id').get(getNote).put(updateNote).delete(deleteNote);

module.exports = router;

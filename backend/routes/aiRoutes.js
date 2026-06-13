const express = require('express');
const { getReports, generate } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect());

router.get('/', getReports);
router.post('/generate', generate);

module.exports = router;

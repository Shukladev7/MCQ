const express = require('express');
const router = express.Router();
const { getQuestions, saveAnswers, submitMCQ } = require('../controllers/mcqController');
const { protect } = require('../middleware/auth');

router.get('/questions', protect, getQuestions);
router.post('/save', protect, saveAnswers);
router.post('/submit', protect, submitMCQ);

module.exports = router;

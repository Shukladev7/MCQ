const express = require('express');
const router = express.Router();
const { getQuestions, runCode, submitCode, getUserSubmissions } = require('../controllers/codingController');
const { protect } = require('../middleware/auth');

router.get('/questions', protect, getQuestions);
router.post('/run', protect, runCode);
router.post('/submit', protect, submitCode);
router.get('/submissions', protect, getUserSubmissions);

module.exports = router;

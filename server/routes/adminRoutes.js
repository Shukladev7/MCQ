const express = require('express')
const router  = express.Router()
const {
  addMCQQuestion, getMCQQuestions, updateMCQQuestion, deleteMCQQuestion, deleteMassMCQQuestions,
  setTestConfig, getTestConfig, getMCQResults, getParticipants,
  notifyTabViolation, upload
} = require('../controllers/adminController')
const { protect, adminOnly } = require('../middleware/auth')

const guard = [protect, adminOnly]

router.get('/mcq/questions',       guard, getMCQQuestions)
router.post('/mcq/questions',      guard, upload.single('questionImage'), addMCQQuestion)
router.put('/mcq/questions/:id',   guard, upload.single('questionImage'), updateMCQQuestion)
router.delete('/mcq/questions/:id',guard, deleteMCQQuestion)
router.post('/mcq/questions/mass-delete', guard, deleteMassMCQQuestions)

router.get('/config',  guard, getTestConfig)
router.post('/config', guard, setTestConfig)

router.get('/results/mcq',   guard, getMCQResults)
router.get('/participants',  guard, getParticipants)

// Tab violation — called by client, auth required
router.post('/notify/tab-violation', protect, notifyTabViolation)

module.exports = router
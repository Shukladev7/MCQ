const MCQQuestion    = require('../models/MCQQuestion')
const MCQResult      = require('../models/MCQResult')
const CodingQuestion = require('../models/CodingQuestion')
const TestConfig     = require('../models/TestConfig')
const User           = require('../models/User')
const path           = require('path')
const fs             = require('fs')
const multer         = require('multer')

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, `q_${Date.now()}${path.extname(file.originalname)}`)
})
exports.upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

// ── MCQ ───────────────────────────────────────────────────────────────────────
exports.addMCQQuestion = async (req, res) => {
  try {
    const { questionText, options, correctOption, marks, negativeMarks, order } = req.body
    const questionImage = req.file ? `/uploads/${req.file.filename}` : null
    const q = await MCQQuestion.create({
      questionText, questionImage,
      options: JSON.parse(options),
      correctOption: parseInt(correctOption),
      marks: parseInt(marks) || 4,
      negativeMarks: parseInt(negativeMarks) || 1,
      order: parseInt(order) || 0
    })
    res.status(201).json({ success: true, question: q })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getMCQQuestions = async (req, res) => {
  try {
    const questions = await MCQQuestion.find({}).sort({ order: 1 })
    res.json({ success: true, questions })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.updateMCQQuestion = async (req, res) => {
  try {
    const updates = { ...req.body }
    if (updates.options && typeof updates.options === 'string') updates.options = JSON.parse(updates.options)
    if (updates.correctOption !== undefined) updates.correctOption = parseInt(updates.correctOption)
    if (req.file) updates.questionImage = `/uploads/${req.file.filename}`
    const q = await MCQQuestion.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' })
    res.json({ success: true, question: q })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.deleteMCQQuestion = async (req, res) => {
  try {
    await MCQQuestion.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.deleteMassMCQQuestions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided for deletion.' });
    }
    await MCQQuestion.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Deleted ${ids.length} questions.` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Test Config — broadcasts via socket.io on save ────────────────────────────
exports.setTestConfig = async (req, res) => {
  try {
    const config = await TestConfig.findOneAndUpdate(
      { isActive: true }, req.body, { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    
    // Core Reset Logic for Re-testing Cycles
    await MCQResult.deleteMany({})
    await User.updateMany({}, { $set: { mcqSubmitted: false, isSuspended: false } })

    // Broadcast updated config to ALL connected clients
    const io = req.app.locals.io
    if (io) {
      io.emit('config:update', {
        mcqStartTime:    config.mcqStartTime,
        mcqEndTime:      config.mcqEndTime,
        mcqDuration:     config.mcqDuration,
        mcqQuestionCount:config.mcqQuestionCount
      })
    }
    res.json({ success: true, config })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getTestConfig = async (req, res) => {
  try {
    const config = await TestConfig.findOne({ isActive: true })
    res.json({ success: true, config })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Results ───────────────────────────────────────────────────────────────────
exports.getMCQResults = async (req, res) => {
  try {
    const results = await MCQResult.find({})
      .populate('userId', 'name scholarNumber branch email')
      .sort({ score: -1 })
    res.json({ success: true, results })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getParticipants = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 })
    res.json({ success: true, users })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// ── Admin: handle tab-violation notification ──────────────────────────────────
exports.notifyTabViolation = async (req, res) => {
  try {
    const { userId, count } = req.body
    const user = await User.findById(userId).select('name scholarNumber')
    const io   = req.app.locals.io
    if (io) {
      io.to('admins').emit('violation:tab', {
        userId, userName: user?.name, scholarNumber: user?.scholarNumber,
        count, timestamp: new Date().toISOString(), autoSubmitted: count >= 3
      })
    }
    res.json({ success: true })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}
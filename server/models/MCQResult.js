const mongoose = require('mongoose');

const mcqResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  answers: {
    type: Map,
    of: Number,
    default: {}
  },
  score: {
    type: Number,
    default: 0
  },
  attempted: {
    type: Number,
    default: 0
  },
  correct: {
    type: Number,
    default: 0
  },
  wrong: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('MCQResult', mcqResultSchema);

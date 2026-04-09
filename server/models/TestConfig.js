const mongoose = require('mongoose');

const testConfigSchema = new mongoose.Schema({
  mcqStartTime: {
    type: Date,
    required: true
  },
  mcqEndTime: {
    type: Date,
    required: true
  },
  codingStartTime: {
    type: Date,
    required: true
  },
  codingEndTime: {
    type: Date,
    required: true
  },
  mcqDuration: {
    type: Number,
    default: 45 // minutes
  },
  codingDuration: {
    type: Number,
    default: 45 // minutes
  },
  mcqQuestionCount: {
    type: Number,
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('TestConfig', testConfigSchema);

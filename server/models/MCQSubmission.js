const mongoose = require('mongoose');

const mcqSubmissionSchema = new mongoose.Schema({
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
  lastSaved: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('MCQSubmission', mcqSubmissionSchema);

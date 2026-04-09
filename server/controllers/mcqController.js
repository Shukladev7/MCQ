const MCQQuestion = require('../models/MCQQuestion');
const MCQSubmission = require('../models/MCQSubmission');
const MCQResult = require('../models/MCQResult');
const User = require('../models/User');

exports.getQuestions = async (req, res) => {
  try {
    // Check if user already submitted
    const user = await User.findById(req.user._id);
    if (user.mcqSubmitted) {
      return res.status(403).json({ success: false, message: 'MCQ already submitted.' });
    }

    const questions = await MCQQuestion.find({}, '-correctOption').sort({ order: 1 });
    
    // Get existing answers if any
    const submission = await MCQSubmission.findOne({ userId: req.user._id });

    res.json({
      success: true,
      questions,
      savedAnswers: submission ? Object.fromEntries(submission.answers) : {}
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveAnswers = async (req, res) => {
  try {
    const { answers } = req.body;

    const user = await User.findById(req.user._id);
    if (user.mcqSubmitted) {
      return res.status(403).json({ success: false, message: 'MCQ already submitted.' });
    }

    await MCQSubmission.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, answers, lastSaved: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Answers saved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitMCQ = async (req, res) => {
  try {
    const { answers, suspended } = req.body;

    const user = await User.findById(req.user._id);
    if (user.mcqSubmitted) {
      return res.status(403).json({ success: false, message: 'MCQ already submitted.' });
    }

    // Get all questions with correct answers
    const questions = await MCQQuestion.find({}).sort({ order: 1 });

    let score = 0, correct = 0, wrong = 0, attempted = 0;

    for (const question of questions) {
      const qId = question._id.toString();
      if (answers[qId] !== undefined && answers[qId] !== null && answers[qId] !== -1) {
        attempted++;
        if (answers[qId] === question.correctOption) {
          score += question.marks || 4;
          correct++;
        } else {
          score -= question.negativeMarks || 1;
          wrong++;
        }
      }
    }

    // Save result
    await MCQResult.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        answers,
        score,
        attempted,
        correct,
        wrong,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Mark user as submitted logic
    await User.findByIdAndUpdate(req.user._id, { 
      mcqSubmitted: true, 
      ...(suspended && { isSuspended: true })
    });

    res.json({ success: true, message: 'MCQ submitted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

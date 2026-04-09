const CodingQuestion = require('../models/CodingQuestion');
const CodingSubmission = require('../models/CodingSubmission');
const User = require('../models/User');

exports.getQuestions = async (req, res) => {
  try {
    const questions = await CodingQuestion.find({}).sort({ order: 1 });
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.runCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    // If Judge0 is configured, use it
    if (process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_KEY !== 'your_judge0_api_key_here') {
      const languageMap = { c: 50, cpp: 54, python: 71, javascript: 63 };
      const langId = languageMap[language];

      const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: input || ''
        })
      });

      const data = await response.json();
      return res.json({
        success: true,
        output: data.stdout || data.stderr || data.compile_output || 'No output',
        status: data.status?.description || 'Unknown'
      });
    }

    // Fallback: simulate execution
    res.json({
      success: true,
      output: '⚠️ Code execution requires Judge0 API configuration.\nPlease add JUDGE0_API_KEY to .env file.',
      status: 'Simulated'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitCode = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;

    const submission = await CodingSubmission.create({
      userId: req.user._id,
      questionId,
      code,
      language,
      verdict: 'Pending',
      submittedAt: new Date()
    });

    // Mark user coding as submitted if they submit at least one
    await User.findByIdAndUpdate(req.user._id, { codingSubmitted: true });

    res.json({ success: true, message: 'Code submitted successfully.', submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserSubmissions = async (req, res) => {
  try {
    const submissions = await CodingSubmission.find({ userId: req.user._id })
      .populate('questionId', 'title');
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

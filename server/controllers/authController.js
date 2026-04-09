const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, scholarNumber, branch, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { scholarNumber }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Scholar number already registered'
      });
    }

    await User.create({ name, email, scholarNumber, branch, password });

    res.status(201).json({
      success: true,
      message: 'Registration successful.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        scholarNumber: user.scholarNumber,
        branch: user.branch,
        role: user.role,
        mcqSubmitted: user.mcqSubmitted,
        codingSubmitted: user.codingSubmitted
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        scholarNumber: user.scholarNumber,
        branch: user.branch,
        role: user.role,
        mcqSubmitted: user.mcqSubmitted,
        codingSubmitted: user.codingSubmitted
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

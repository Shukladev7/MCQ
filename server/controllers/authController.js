const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendVerificationEmail = async (email, url) => {
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
    try {
      await transporter.sendMail({
        from: `"Vision CSE Recruitment" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Verify Your Candidate Account - Vision CSE",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #030603; color: #eafcec; padding: 40px; border-radius: 12px; border: 1px solid #00ff6633;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #00ff66; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Vision CSE Recruitment</h2>
            <p style="color: #9ebc9e; font-size: 14px; margin-top: 5px;">Candidate Account Verification</p>
          </div>
          <div style="background: #09120a; padding: 30px; border-radius: 8px; border: 1px solid #102113;">
            <h3 style="margin-top: 0; color: #fff;">Account Clearance Required</h3>
            <p style="color: #9ebc9e; line-height: 1.6;">You have successfully registered your candidate profile. To finalize your account mapping and prove ownership, please securely verify your email address below.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${url}" style="background: #00ff66; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Verify Candidate Account</a>
            </div>
            <p style="color: #4a754a; font-size: 12px; text-align: center; word-break: break-all;">Having trouble? Copy this link manually:<br/><a href="${url}" style="color: #00ff66;">${url}</a></p>
          </div>
          <p style="color: #4a754a; font-size: 12px; text-align: center; margin-top: 30px;">© 2026 Vision CSE Department</p>
        </div>`
      });
      console.log('Verification email dispatched strictly to:', email);
    } catch (err) {
      console.error('Nodemailer pipeline error:', err);
    }
  } else {
    console.log('\n\n======================================================');
    console.log('NO SMTP ENV CONFIG DETECTED -> MOCKING EMAIL OUTBOUND');
    console.log('EMAIL VERIFICATION REQUIRED FOR:', email);
    console.log('CLICK THIS LINK TO VERIFY THE ACCOUNT:');
    console.log(url);
    console.log('======================================================\n\n');
  }
}

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

    const isEmailVerified = false;
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    const user = await User.create({ 
      name, email, scholarNumber, branch, password,
      isEmailVerified, emailVerificationToken, emailVerificationExpires
    });

    // Automated Nodemailer pipeline intercepting generated Crypto IDs
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const verifyUrl = `${apiUrl}/api/auth/verify-email/${emailVerificationToken}`;
    await sendVerificationEmail(user.email, verifyUrl);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your securely dispatched email to verify your target account.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) return res.status(400).send('Invalid or expired verification token.');
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?verified=true`);
  } catch (err) {
    res.status(500).send('Server Error');
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

    if (user.role === 'user' && !user.isEmailVerified) {
       return res.status(403).json({ success: false, message: 'Unverified Access. Please authenticate the verification link dispatched exclusively to your email.' });
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

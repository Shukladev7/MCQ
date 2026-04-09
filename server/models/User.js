const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  scholarNumber: {
    type: String,
    required: [true, 'Scholar number is required'],
    unique: true,
    trim: true
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'Other']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  mcqSubmitted: {
    type: Boolean,
    default: false
  },
  codingSubmitted: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  avatarPublicId: {
    type: String,
    default: '',
  },
  headline: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 30,
    default: '',
  },
  college: {
    type: String,
    trim: true,
    maxlength: 120,
    default: '',
  },
  branch: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  graduationYear: {
    type: Number,
    min: 2000,
    max: 2100,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100,
    default: '',
  },
  github: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  linkedin: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  portfolio: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  weakTopics: {
    type: [String],
    default: [],
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  testsCompleted: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

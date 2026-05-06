const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const Submission = require('../models/Submission');
const Result = require('../models/Result');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { uploadProfileImage } = require('../services/cloudinaryService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

function cleanString(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function cleanUrl(value) {
  const url = cleanString(value, 200);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function cleanSkills(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  return source
    .map((skill) => cleanString(skill, 40))
    .filter(Boolean)
    .slice(0, 20);
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    bio: user.bio,
    phone: user.phone,
    college: user.college,
    branch: user.branch,
    graduationYear: user.graduationYear,
    location: user.location,
    github: user.github,
    linkedin: user.linkedin,
    portfolio: user.portfolio,
    skills: user.skills,
    weakTopics: user.weakTopics,
    totalScore: user.totalScore,
    testsCompleted: user.testsCompleted,
    createdAt: user.createdAt,
  };
}

async function buildProfileStats(userId) {
  const [totalSubmissions, passedSubmissions, latestResult, latestResume] = await Promise.all([
    Submission.countDocuments({ userId }),
    Submission.countDocuments({ userId, status: 'passed' }),
    Result.findOne({ userId }).sort({ createdAt: -1 }).select('scores createdAt'),
    ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }).select('atsScore createdAt'),
  ]);

  return {
    totalSubmissions,
    passedSubmissions,
    accuracy: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
    latestScore: latestResult?.scores?.overall || 0,
    latestAtsScore: latestResume?.atsScore || 0,
  };
}

router.get('/', protect, async (req, res) => {
  try {
    const stats = await buildProfileStats(req.user._id);
    res.json({ user: serializeUser(req.user), stats });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/', protect, async (req, res) => {
  try {
    const graduationYear = req.body.graduationYear ? Number(req.body.graduationYear) : undefined;

    req.user.name = cleanString(req.body.name, 50) || req.user.name;
    req.user.headline = cleanString(req.body.headline, 120);
    req.user.bio = cleanString(req.body.bio, 500);
    req.user.phone = cleanString(req.body.phone, 30);
    req.user.college = cleanString(req.body.college, 120);
    req.user.branch = cleanString(req.body.branch, 80);
    req.user.location = cleanString(req.body.location, 100);
    req.user.github = cleanUrl(req.body.github);
    req.user.linkedin = cleanUrl(req.body.linkedin);
    req.user.portfolio = cleanUrl(req.body.portfolio);
    req.user.skills = cleanSkills(req.body.skills);
    req.user.graduationYear = Number.isFinite(graduationYear) ? graduationYear : undefined;

    await req.user.save();
    const stats = await buildProfileStats(req.user._id);
    res.json({ message: 'Profile updated', user: serializeUser(req.user), stats });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a profile image' });
    }

    const uploaded = await uploadProfileImage(req.file, req.user._id);
    req.user.avatarUrl = uploaded.avatarUrl;
    req.user.avatarPublicId = uploaded.avatarPublicId;
    await req.user.save();

    const stats = await buildProfileStats(req.user._id);
    res.json({ message: 'Profile picture updated', user: serializeUser(req.user), stats });
  } catch (error) {
    console.error('Avatar upload error:', error.response?.data || error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message || 'Failed to upload profile picture' });
  }
});

module.exports = router;

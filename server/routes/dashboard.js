const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Result = require('../models/Result');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { generateMCQQuestions } = require('../services/aiService');
const { TIME_ZONE, getDateKeyInTimeZone, makeZonedDate, shiftDateKey } = require('../utils/time');

// GET /api/dashboard/stats - User dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent results
    const results = await Result.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get submission stats
    const totalSubmissions = await Submission.countDocuments({ userId });
    const passedSubmissions = await Submission.countDocuments({ userId, status: 'passed' });

    // Get recent submissions
    const recentSubmissions = await Submission.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('questionId', 'type topic difficulty question problemStatement');

    let latestResume = await ResumeAnalysis.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('summary topics questions createdAt');

    if (!latestResume || latestResume.questions?.length === 0) {
      try {
        const seedTopic = req.user.weakTopics?.[0] || 'JavaScript Fundamentals';
        const generated = await generateMCQQuestions(seedTopic, 'medium', 5);

        latestResume = await ResumeAnalysis.create({
          userId,
          summary: `Auto-generated from your performance in ${seedTopic}.`,
          topics: [seedTopic],
          questions: generated.map((q) => ({
            ...q,
            type: 'Aptitude',
            difficulty: 'medium',
          })),
        });
      } catch (error) {
        console.error('Auto question generation error:', error.message || error);
      }
    }

    // Calculate streaks and trends
    const latestResult = results[0];
    const previousResult = results[1];

    let trend = 'stable';
    if (latestResult && previousResult) {
      if (latestResult.scores.overall > previousResult.scores.overall) trend = 'improving';
      else if (latestResult.scores.overall < previousResult.scores.overall) trend = 'declining';
    }

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        totalScore: req.user.totalScore,
        testsCompleted: req.user.testsCompleted,
        weakTopics: req.user.weakTopics,
      },
      stats: {
        totalSubmissions,
        passedSubmissions,
        accuracy: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
        trend,
      },
      results,
      recentSubmissions,
      resume: latestResume,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/leaderboard - Daily leaderboard (combined rounds)
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
    const dayStart = makeZonedDate(todayKey, '00:00', TIME_ZONE);
    const nextDayKey = shiftDateKey(todayKey, 1, TIME_ZONE);
    const dayEnd = makeZonedDate(nextDayKey, '00:00', TIME_ZONE);

    // Aggregate scores from recent results
    const leaderboard = await Result.aggregate([
      {
        $match: {
          testType: 'assessment',
          $or: [
            { roundDateKey: todayKey },
            { roundDateKey: { $exists: false }, createdAt: { $gte: dayStart, $lt: dayEnd } },
            { roundDateKey: null, createdAt: { $gte: dayStart, $lt: dayEnd } },
          ],
        },
      },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$scores.overall' },
          testsCompleted: { $sum: 1 },
          avgScore: { $avg: '$scores.overall' },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          testsCompleted: 1,
          avgScore: { $round: ['$avgScore', 1] },
          name: '$user.name',
          email: '$user.email',
        },
      },
    ]);

    // Add rank
    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    res.json({ leaderboard: ranked });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// GET /api/dashboard/admin-stats - Admin analytics
router.get('/admin-stats', protect, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    const questionsByType = await Question.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const questionsByDifficulty = await Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role testsCompleted totalScore createdAt');

    res.json({
      overview: { totalUsers, totalQuestions, totalSubmissions },
      questionsByType,
      questionsByDifficulty,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

module.exports = router;

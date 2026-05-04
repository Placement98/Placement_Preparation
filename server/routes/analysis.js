const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyzeTestResults, getPerformanceHistory } = require('../services/analysisService');
const Submission = require('../models/Submission');

// POST /api/analysis/analyze - Analyze recent submissions
router.post('/analyze', protect, async (req, res) => {
  try {
    const { submissionIds } = req.body;

    let submissions;
    if (submissionIds && submissionIds.length > 0) {
      submissions = await Submission.find({
        _id: { $in: submissionIds },
        userId: req.user._id,
      }).populate('questionId');
    } else {
      // Analyze last 20 submissions
      submissions = await Submission.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('questionId');
    }

    const result = await analyzeTestResults(req.user._id, submissions, 'practice');

    res.json({
      message: 'Analysis complete',
      result: {
        scores: result.scores,
        topicScores: result.topicScores,
        weakTopics: result.weakTopics,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze results' });
  }
});

// GET /api/analysis/history
router.get('/history', protect, async (req, res) => {
  try {
    const data = await getPerformanceHistory(req.user._id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

module.exports = router;

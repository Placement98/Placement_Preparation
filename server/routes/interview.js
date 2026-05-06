const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { generateInterviewQuestions, evaluateInterviewAnswers } = require('../services/aiService');

async function buildInterviewContext(user) {
  const latestResume = await ResumeAnalysis.findOne({ userId: user._id })
    .sort({ createdAt: -1 })
    .select('summary topics improvements questions atsScore createdAt');

  return {
    name: user.name,
    headline: user.headline,
    college: user.college,
    branch: user.branch,
    graduationYear: user.graduationYear,
    skills: user.skills || [],
    weakTopics: user.weakTopics || [],
    totalScore: user.totalScore || 0,
    testsCompleted: user.testsCompleted || 0,
    resumeSummary: latestResume?.summary || '',
    topics: latestResume?.topics?.length ? latestResume.topics : user.skills || [],
    resumeImprovements: latestResume?.improvements || [],
    atsScore: latestResume?.atsScore || 0,
  };
}

router.post('/generate', protect, async (req, res) => {
  try {
    const count = Math.max(3, Math.min(8, Number(req.body.count) || 6));
    const context = await buildInterviewContext(req.user);
    const questions = await generateInterviewQuestions(context, count);

    res.json({
      message: 'Interview questions generated',
      questions,
      context: {
        topics: context.topics,
        weakTopics: context.weakTopics,
        atsScore: context.atsScore,
      },
    });
  } catch (error) {
    console.error('Interview generation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate interview questions' });
  }
});

router.post('/evaluate', protect, async (req, res) => {
  try {
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (questions.length === 0) {
      return res.status(400).json({ message: 'No interview questions submitted' });
    }

    const context = await buildInterviewContext(req.user);
    const result = await evaluateInterviewAnswers(questions, answers, context);

    res.json({
      message: 'Interview evaluated',
      result,
    });
  } catch (error) {
    console.error('Interview evaluation error:', error);
    res.status(500).json({ message: error.message || 'Failed to evaluate interview' });
  }
});

module.exports = router;

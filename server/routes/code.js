const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const { protect } = require('../middleware/auth');
const { validateCodeSubmission } = require('../middleware/validator');
const { codeLimiter } = require('../middleware/rateLimiter');
const { runBatchSubmissions, runCode } = require('../services/judge0Service');

// POST /api/code/run - Run code against visible test cases only
router.post('/run', protect, codeLimiter, async (req, res) => {
  try {
    const { code, language, questionId, customInput } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    // If custom input provided, run with that
    if (customInput !== undefined) {
      const result = await runCode(code, language, customInput);
      return res.json({ results: [result] });
    }

    // Otherwise run against visible test cases
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const visibleTestCases = question.testCases.filter(tc => !tc.isHidden);
    if (visibleTestCases.length === 0) {
      return res.status(400).json({ message: 'No test cases available' });
    }

    const results = await runBatchSubmissions(code, language, visibleTestCases);

    res.json({
      results,
      passed: results.filter(r => r.passed).length,
      total: results.length,
    });
  } catch (error) {
    console.error('Code run error:', error);
    res.status(500).json({ message: 'Failed to run code' });
  }
});

// POST /api/code/submit - Submit code against ALL test cases (including hidden)
router.post('/submit', protect, codeLimiter, validateCodeSubmission, async (req, res) => {
  try {
    const { code, language, questionId } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.type !== 'DSA') {
      return res.status(400).json({ message: 'Code submission only for DSA questions' });
    }

    // Run against ALL test cases
    const results = await runBatchSubmissions(code, language, question.testCases);
    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;

    // Save submission
    const submission = await Submission.create({
      userId: req.user._id,
      questionId,
      code,
      language,
      results,
      status: allPassed ? 'passed' : 'failed',
      score: allPassed ? 1 : 0,
    });

    // Return results (hide hidden test case details)
    const sanitizedResults = results.map((r, i) => {
      const testCase = question.testCases[i];
      if (testCase && testCase.isHidden) {
        return {
          testCaseIndex: r.testCaseIndex,
          passed: r.passed,
          time: r.time,
          memory: r.memory,
          isHidden: true,
        };
      }
      return { ...r, isHidden: false };
    });

    res.json({
      message: allPassed ? 'All test cases passed! 🎉' : `${passedCount}/${results.length} test cases passed`,
      submission: {
        id: submission._id,
        status: submission.status,
        score: submission.score,
      },
      results: sanitizedResults,
      passed: passedCount,
      total: results.length,
    });
  } catch (error) {
    console.error('Code submit error:', error);
    res.status(500).json({ message: 'Failed to submit code' });
  }
});

module.exports = router;

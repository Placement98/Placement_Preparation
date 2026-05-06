const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const AssessmentRound = require('../models/AssessmentRound');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');
const { analyzeTestResults } = require('../services/analysisService');
const { sendPracticeEmail } = require('../services/emailService');
const { getRoundForSlot, ROUND_CONFIG } = require('../services/assessmentService');
const { TIME_ZONE, getDateKeyInTimeZone, makeZonedDate, shiftDateKey } = require('../utils/time');

// POST /api/test/start - Start an assessment test
router.post('/start', protect, async (req, res) => {
  try {
    const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
    const dayStart = makeZonedDate(todayKey, '00:00', TIME_ZONE);
    const nextKey = shiftDateKey(todayKey, 1, TIME_ZONE);
    const dayEnd = makeZonedDate(nextKey, '00:00', TIME_ZONE);

    const roundsCompletedToday = await Result.countDocuments({
      userId: req.user._id,
      testType: 'assessment',
      $or: [
        { roundDateKey: todayKey },
        { roundDateKey: { $exists: false }, createdAt: { $gte: dayStart, $lt: dayEnd } },
        { roundDateKey: null, createdAt: { $gte: dayStart, $lt: dayEnd } },
      ],
    });

    if (roundsCompletedToday >= 2) {
      return res.status(403).json({
        message: 'You have completed both rounds for today. Please come back tomorrow for new questions.',
        roundsCompletedToday,
        roundsRemainingToday: 0,
      });
    }

    const slot = roundsCompletedToday === 0 ? 'morning' : 'evening';
    const round = await getRoundForSlot(todayKey, slot);
    const questionIds = round?.questionIds || [];
    const allQuestions = questionIds.length
      ? await Question.find({ _id: { $in: questionIds } })
      : [];

    const orderedQuestions = questionIds.length
      ? questionIds.map((id) => allQuestions.find((q) => q._id.equals(id))).filter(Boolean)
      : allQuestions;

    // Sanitize - remove answers
    const sanitized = orderedQuestions.map(q => {
      const copy = q.toObject();
      delete copy.correctAnswer;
      delete copy.explanation;
      if (copy.testCases) {
        copy.testCases = copy.testCases.filter(tc => !tc.isHidden);
      }
      return copy;
    });

    if (sanitized.length === 0) {
      return res.status(503).json({ message: 'Assessment questions are not ready yet. Please try again shortly.' });
    }

    res.json({
      message: 'Test started',
      questions: sanitized,
      totalQuestions: sanitized.length,
      timeLimit: 60 * 60, // 60 minutes in seconds
      startedAt: new Date(),
      round: round
        ? {
          id: round._id,
          dateKey: round.dateKey,
          slot: round.slot,
          dsaCount: ROUND_CONFIG.dsaCount,
          aptitudeCount: ROUND_CONFIG.aptitudeCount,
        }
        : null,
      roundNumber: roundsCompletedToday + 1,
      roundsCompletedToday,
      roundsRemainingToday: 2 - roundsCompletedToday,
    });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Failed to start test' });
  }
});

// POST /api/test/submit - Submit test answers
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken, roundId } = req.body;
    // answers: [{ questionId, selectedAnswer (for MCQ), code, language (for DSA) }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const submissions = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (!question) continue;

      const submissionData = {
        userId: req.user._id,
        questionId: answer.questionId,
        source: 'assessment',
      };

      if (question.type === 'Aptitude') {
        submissionData.selectedAnswer = answer.selectedAnswer;
        submissionData.status = answer.selectedAnswer === question.correctAnswer ? 'passed' : 'failed';
        submissionData.score = submissionData.status === 'passed' ? 1 : 0;
      } else if (question.type === 'DSA') {
        // For DSA in test mode, we do a simplified check
        // Full code execution happens on the coding editor page
        submissionData.code = answer.code || '';
        submissionData.language = answer.language || 'javascript';
        submissionData.status = answer.code ? 'pending' : 'failed';
        submissionData.score = 0;
      }

      const submission = await Submission.create(submissionData);
      submissions.push(submission);
    }

    // Populate questions for analysis
    const populatedSubmissions = await Submission.find({
      _id: { $in: submissions.map(s => s._id) },
    }).populate('questionId');

    // Analyze results
    let roundMeta = null;
    if (roundId) {
      const round = await AssessmentRound.findById(roundId);
      if (round) {
        roundMeta = {
          roundId: round._id,
          roundDateKey: round.dateKey,
          roundSlot: round.slot,
        };
      }
    }

    const result = await analyzeTestResults(req.user._id, populatedSubmissions, 'assessment', roundMeta);

    const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
    const dayStart = makeZonedDate(todayKey, '00:00', TIME_ZONE);
    const nextKey = shiftDateKey(todayKey, 1, TIME_ZONE);
    const dayEnd = makeZonedDate(nextKey, '00:00', TIME_ZONE);

    const roundsCompletedToday = await Result.countDocuments({
      userId: req.user._id,
      testType: 'assessment',
      $or: [
        { roundDateKey: todayKey },
        { roundDateKey: { $exists: false }, createdAt: { $gte: dayStart, $lt: dayEnd } },
        { roundDateKey: null, createdAt: { $gte: dayStart, $lt: dayEnd } },
      ],
    });

    const nextRoundAvailable = roundsCompletedToday < 2;
    const dayComplete = roundsCompletedToday >= 2;
    const roundNumber = roundMeta?.roundSlot === 'evening' ? 2 : 1;

    // Auto-send practice email if weak topics detected (fire-and-forget)
    if (result.weakTopics && result.weakTopics.length > 0) {
      sendPracticeEmail(req.user.email, req.user.name, result.weakTopics)
        .then((emailResult) => {
          console.log(`📧 Auto-email sent to ${req.user.email}: ${emailResult.message}`);
        })
        .catch((emailErr) => {
          console.log(`📧 Auto-email skipped (not configured): ${emailErr.message}`);
        });
    }

    res.json({
      message: 'Test submitted successfully',
      emailSent: result.weakTopics?.length > 0,
      nextRoundAvailable,
      dayComplete,
      roundNumber,
      roundsCompletedToday,
      roundsRemainingToday: Math.max(0, 2 - roundsCompletedToday),
      dayCompleteMessage: dayComplete
        ? 'For today, both rounds are completed. Please come back tomorrow for new questions. Thank you!'
        : null,
      result: {
        scores: result.scores,
        topicScores: result.topicScores,
        weakTopics: result.weakTopics,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
      },
    });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ message: 'Failed to submit test' });
  }
});

module.exports = router;

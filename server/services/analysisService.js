const Result = require('../models/Result');
const Submission = require('../models/Submission');
const User = require('../models/User');

const WEAK_THRESHOLD = 0.5; // 50% accuracy threshold

/**
 * Analyze test results and identify weak topics
 */
async function analyzeTestResults(userId, submissions, testType = 'assessment', roundMeta = null) {
  const topicScores = {};
  const topicTotals = {};
  let dsaCorrect = 0, dsaTotal = 0;
  let aptCorrect = 0, aptTotal = 0;
  let totalCorrect = 0;

  for (const sub of submissions) {
    const question = sub.questionId;
    if (!question) continue;

    const topic = question.topic || 'General';
    if (!topicScores[topic]) {
      topicScores[topic] = 0;
      topicTotals[topic] = 0;
    }

    topicTotals[topic]++;

    if (sub.status === 'passed') {
      topicScores[topic]++;
      totalCorrect++;

      if (question.type === 'DSA') dsaCorrect++;
      else aptCorrect++;
    }

    if (question.type === 'DSA') dsaTotal++;
    else aptTotal++;
  }

  // Calculate percentages
  const topicPercentages = {};
  const weakTopics = [];

  for (const topic of Object.keys(topicScores)) {
    const pct = topicTotals[topic] > 0 ? topicScores[topic] / topicTotals[topic] : 0;
    topicPercentages[topic] = Math.round(pct * 100);

    if (pct < WEAK_THRESHOLD) {
      weakTopics.push(topic);
    }
  }

  const dsaScore = dsaTotal > 0 ? Math.round((dsaCorrect / dsaTotal) * 100) : 0;
  const aptScore = aptTotal > 0 ? Math.round((aptCorrect / aptTotal) * 100) : 0;
  const overallScore = submissions.length > 0 ? Math.round((totalCorrect / submissions.length) * 100) : 0;

  // Save result
  const result = await Result.create({
    userId,
    testType,
    roundId: roundMeta?.roundId || undefined,
    roundDateKey: roundMeta?.roundDateKey || undefined,
    roundSlot: roundMeta?.roundSlot || undefined,
    scores: { DSA: dsaScore, Aptitude: aptScore, overall: overallScore },
    topicScores: topicPercentages,
    weakTopics,
    totalQuestions: submissions.length,
    correctAnswers: totalCorrect,
  });

  // Update user's weak topics and score
  await User.findByIdAndUpdate(userId, {
    weakTopics,
    $inc: { totalScore: overallScore, testsCompleted: 1 },
  });

  return result;
}

/**
 * Get user performance history
 */
async function getPerformanceHistory(userId) {
  const results = await Result.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20);

  const recentSubmissions = await Submission.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('questionId', 'type topic difficulty question problemStatement');

  return { results, recentSubmissions };
}

module.exports = { analyzeTestResults, getPerformanceHistory };

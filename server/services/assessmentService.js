const cron = require('node-cron');
const AssessmentRound = require('../models/AssessmentRound');
const Question = require('../models/Question');
const { generateFixedMixQuestions } = require('./aiService');
const { TIME_ZONE, getDateKeyInTimeZone, makeZonedDate, shiftDateKey } = require('../utils/time');

const ROUND_TIMES = {
  morning: '09:00',
  evening: '21:00',
};

const ROUND_CONFIG = {
  dsaCount: 3,
  aptitudeCount: 12,
};

function getRoundBounds(dateKey, slot) {
  if (slot === 'morning') {
    const startAt = makeZonedDate(dateKey, ROUND_TIMES.morning);
    const endAt = makeZonedDate(dateKey, ROUND_TIMES.evening);
    return { startAt, endAt };
  }

  const startAt = makeZonedDate(dateKey, ROUND_TIMES.evening);
  const nextDateKey = shiftDateKey(dateKey, 1);
  const endAt = makeZonedDate(nextDateKey, ROUND_TIMES.morning);
  return { startAt, endAt };
}

async function ensureRound(dateKey, slot) {
  const existing = await AssessmentRound.findOne({ dateKey, slot });
  if (existing) return existing;

  const { startAt, endAt } = getRoundBounds(dateKey, slot);
  const generated = await generateFixedMixQuestions(ROUND_CONFIG.dsaCount, ROUND_CONFIG.aptitudeCount);
  const savedQuestions = await Question.insertMany(generated);

  const round = await AssessmentRound.create({
    dateKey,
    slot,
    startAt,
    endAt,
    questionIds: savedQuestions.map((q) => q._id),
  });

  return round;
}

async function warmUpTodayRounds() {
  const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
  await ensureRound(todayKey, 'morning');
  await ensureRound(todayKey, 'evening');
}

async function getCurrentRound() {
  const now = new Date();
  const todayKey = getDateKeyInTimeZone(now, TIME_ZONE);
  const morningStart = makeZonedDate(todayKey, ROUND_TIMES.morning);
  const eveningStart = makeZonedDate(todayKey, ROUND_TIMES.evening);

  if (now < morningStart) {
    const prevKey = shiftDateKey(todayKey, -1);
    return ensureRound(prevKey, 'evening');
  }

  if (now < eveningStart) {
    return ensureRound(todayKey, 'morning');
  }

  return ensureRound(todayKey, 'evening');
}

function startAssessmentScheduler() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
      await ensureRound(todayKey, 'morning');
    } catch (error) {
      console.error('Morning round generation failed:', error);
    }
  }, { timezone: TIME_ZONE });

  cron.schedule('0 21 * * *', async () => {
    try {
      const todayKey = getDateKeyInTimeZone(new Date(), TIME_ZONE);
      await ensureRound(todayKey, 'evening');
    } catch (error) {
      console.error('Evening round generation failed:', error);
    }
  }, { timezone: TIME_ZONE });

  warmUpTodayRounds().catch((error) => {
    console.error('Assessment warm-up failed:', error);
  });
}

module.exports = {
  startAssessmentScheduler,
  getCurrentRound,
  ROUND_CONFIG,
};

const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  testType: {
    type: String,
    enum: ['assessment', 'practice'],
    default: 'assessment',
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentRound',
    index: true,
  },
  roundDateKey: {
    type: String,
    index: true,
  },
  roundSlot: {
    type: String,
    enum: ['morning', 'evening'],
  },
  scores: {
    DSA: { type: Number, default: 0 },
    Aptitude: { type: Number, default: 0 },
    overall: { type: Number, default: 0 },
  },
  topicScores: {
    type: Map,
    of: Number,
    default: {},
  },
  weakTopics: {
    type: [String],
    default: [],
  },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // seconds
  createdAt: { type: Date, default: Date.now },
});

resultSchema.index({ userId: 1, createdAt: -1 });
resultSchema.index({ roundDateKey: 1, userId: 1 });

module.exports = mongoose.model('Result', resultSchema);

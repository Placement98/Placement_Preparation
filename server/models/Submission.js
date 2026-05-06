const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testCaseIndex: Number,
  passed: Boolean,
  output: String,
  expected: String,
  time: String,
  memory: String,
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  code: { type: String },
  language: { type: String },
  selectedAnswer: { type: String }, // For MCQ
  results: [testResultSchema],
  source: {
    type: String,
    enum: ['assessment', 'practice'],
    default: 'practice',
    index: true,
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'error', 'pending'],
    default: 'pending',
  },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, questionId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);

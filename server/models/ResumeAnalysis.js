const mongoose = require('mongoose');

const resumeQuestionSchema = new mongoose.Schema({
  type: { type: String, default: 'Technical' },
  difficulty: { type: String, default: 'medium' },
  question: { type: String, required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: false });

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  summary: { type: String, default: '' },
  topics: { type: [String], default: [] },
  questions: { type: [resumeQuestionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

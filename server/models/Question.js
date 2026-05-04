const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['DSA', 'Aptitude'],
    required: [true, 'Question type is required'],
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty is required'],
    index: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    index: true,
  },
  // Aptitude (MCQ) fields
  question: { type: String },
  options: { type: [String] },
  correctAnswer: { type: String },
  explanation: { type: String },
  // DSA (Coding) fields
  problemStatement: { type: String },
  functionSignature: {
    javascript: String,
    python: String,
    cpp: String,
    java: String,
  },
  starterCode: {
    javascript: String,
    python: String,
    cpp: String,
    java: String,
  },
  testCases: [testCaseSchema],
  // Meta
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for efficient filtering
questionSchema.index({ type: 1, topic: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);

const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect, requireAdmin } = require('../middleware/auth');
const { validateQuestionGen } = require('../middleware/validator');
const { generateMCQQuestions, generateDSAQuestions } = require('../services/aiService');

// POST /api/questions/generate-ai - Generate questions with AI
router.post('/generate-ai', protect, requireAdmin, validateQuestionGen, async (req, res) => {
  try {
    const { topic, type, difficulty, count = 3 } = req.body;

    let generated;
    if (type === 'Aptitude') {
      generated = await generateMCQQuestions(topic, difficulty, count);
    } else {
      generated = await generateDSAQuestions(topic, difficulty, count);
    }

    // Save to database
    const savedQuestions = [];
    for (const q of generated) {
      const questionData = {
        type,
        difficulty,
        topic,
        aiGenerated: true,
      };

      if (type === 'Aptitude') {
        questionData.question = q.question;
        questionData.options = q.options;
        questionData.correctAnswer = q.correctAnswer;
        questionData.explanation = q.explanation;
      } else {
        questionData.problemStatement = q.problemStatement;
        questionData.functionSignature = q.functionSignature;
        questionData.starterCode = q.starterCode;
        questionData.testCases = q.testCases;
      }

      const saved = await Question.create(questionData);
      savedQuestions.push(saved);
    }

    res.status(201).json({
      message: `${savedQuestions.length} questions generated successfully`,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    const message = error.message || 'Failed to generate questions. Check AI API key configuration.';
    res.status(500).json({ message });
  }
});

// GET /api/questions - Get questions with filters
router.get('/', protect, async (req, res) => {
  try {
    const { type, topic, difficulty, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Hide correct answers and hidden test cases for non-admin
    const sanitized = questions.map(q => {
      const obj = q.toObject();
      if (req.user.role !== 'admin') {
        delete obj.correctAnswer;
        delete obj.explanation;
        if (obj.testCases) {
          obj.testCases = obj.testCases.filter(tc => !tc.isHidden);
        }
      }
      return obj;
    });

    res.json({
      questions: sanitized,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const obj = question.toObject();
    if (req.user.role !== 'admin') {
      delete obj.correctAnswer;
      delete obj.explanation;
      if (obj.testCases) {
        obj.testCases = obj.testCases.filter(tc => !tc.isHidden);
      }
    }

    res.json({ question: obj });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch question' });
  }
});

// POST /api/questions - Manually add question
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create question' });
  }
});

// PUT /api/questions/:id
router.put('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question updated', question });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update question' });
  }
});

// DELETE /api/questions/:id
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

module.exports = router;

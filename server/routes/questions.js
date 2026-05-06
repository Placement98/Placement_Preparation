const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect, requireAdmin } = require('../middleware/auth');
const { validateQuestionGen, validateCompanyGen, validateCoreGen } = require('../middleware/validator');
const { generateMCQQuestions, generateDSAQuestions, generateCompanyQuestions } = require('../services/aiService');

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

// POST /api/questions/generate-company - Generate company-based questions
router.post('/generate-company', protect, validateCompanyGen, async (req, res) => {
  try {
    const { company, dsaCount = 3, aptitudeCount = 12 } = req.body;

    const generated = await generateCompanyQuestions(company, dsaCount, aptitudeCount);
    const savedQuestions = await Question.insertMany(generated);

    res.status(201).json({
      message: `${savedQuestions.length} questions generated for ${company}`,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error('Company question generation error:', error);
    const message = error.message || 'Failed to generate company questions. Check AI API key configuration.';
    res.status(500).json({ message });
  }
});

// POST /api/questions/generate-core - Generate core subject MCQ questions
router.post('/generate-core', protect, validateCoreGen, async (req, res) => {
  try {
    const { subject, difficulty = 'medium', count = 10 } = req.body;
    const generated = await generateMCQQuestions(subject, difficulty, count);

    const savedQuestions = await Promise.all(
      generated.map((q) => Question.create({
        type: 'Aptitude',
        topic: subject,
        difficulty,
        aiGenerated: true,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }))
    );

    res.status(201).json({
      message: `${savedQuestions.length} questions generated for ${subject}`,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error('Core subject generation error:', error);
    const message = error.message || 'Failed to generate core subject questions.';
    res.status(500).json({ message });
  }
});

// GET /api/questions - Get questions with filters
router.get('/', protect, async (req, res) => {
  try {
    const { type, topic, difficulty, page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const filter = {};

    if (type) filter.type = type;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    let total = await Question.countDocuments(filter);
    let questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    if (total === 0 && difficulty) {
      const relaxedFilter = { ...filter };
      delete relaxedFilter.difficulty;

      total = await Question.countDocuments(relaxedFilter);
      questions = await Question.find(relaxedFilter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
    }

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
        page: pageNumber,
        pages: Math.ceil(total / limitNumber),
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

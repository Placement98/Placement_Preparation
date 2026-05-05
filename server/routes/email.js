const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { sendPracticeEmail, sendGeneratedQuestionsToAllUsers } = require('../services/emailService');

// POST /api/email/send-link
router.post('/send-link', protect, async (req, res) => {
  try {
    const weakTopics = req.user.weakTopics || [];

    if (weakTopics.length === 0) {
      return res.status(400).json({ message: 'No weak topics identified. Take a test first!' });
    }

    const result = await sendPracticeEmail(
      req.user.email,
      req.user.name,
      weakTopics
    );

    res.json(result);
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// POST /api/email/send-questions - Generate AI questions and email all users
router.post('/send-questions', protect, requireAdmin, async (req, res) => {
  try {
    const count = parseInt(req.body?.count) || 15;
    const result = await sendGeneratedQuestionsToAllUsers(count);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('Email questions error:', error);
    res.status(500).json({ message: 'Failed to generate or send questions' });
  }
});

module.exports = router;

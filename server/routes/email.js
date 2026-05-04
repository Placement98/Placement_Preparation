const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendPracticeEmail } = require('../services/emailService');

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

module.exports = router;

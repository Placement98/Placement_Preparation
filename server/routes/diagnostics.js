const express = require('express');
const { protect } = require('../middleware/auth');
const { testGroq } = require('../services/aiService');
const { testJudge0 } = require('../services/judge0Service');

const router = express.Router();

// GET /api/diagnostics/groq
router.get('/groq', protect, async (req, res) => {
  try {
    const result = await testGroq();
    res.json({ status: 'ok', result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Groq test failed' });
  }
});

// GET /api/diagnostics/judge0
router.get('/judge0', protect, async (req, res) => {
  try {
    const result = await testJudge0();
    res.json({ status: 'ok', result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Judge0 test failed' });
  }
});

module.exports = router;

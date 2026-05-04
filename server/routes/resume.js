const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { extractResumeText, analyzeResumeText } = require('../services/resumeService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, or TXT files are allowed'));
  },
});

// POST /api/resume/analyze
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    const text = await extractResumeText(req.file);
    if (!text) {
      return res.status(400).json({ message: 'Unable to extract text from resume' });
    }

    const result = await analyzeResumeText(text);
    res.json({ message: 'Resume analyzed', result });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze resume' });
  }
});

module.exports = router;

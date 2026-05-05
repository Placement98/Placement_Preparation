const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Signup validation
const validateSignup = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Question generation validation
const validateQuestionGen = [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('type').isIn(['DSA', 'Aptitude']).withMessage('Type must be DSA or Aptitude'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('count').optional().isInt({ min: 1, max: 10 }).withMessage('Count must be 1-10'),
  handleValidation,
];

const validateCompanyGen = [
  body('company').trim().isLength({ min: 2, max: 80 }).withMessage('Company is required'),
  body('dsaCount').optional().isInt({ min: 1, max: 10 }).withMessage('DSA count must be 1-10'),
  body('aptitudeCount').optional().isInt({ min: 1, max: 30 }).withMessage('Aptitude count must be 1-30'),
  handleValidation,
];

// Code submission validation
const validateCodeSubmission = [
  body('code').notEmpty().withMessage('Code is required'),
  body('language').isIn(['javascript', 'python', 'cpp', 'java']).withMessage('Unsupported language'),
  body('questionId').isMongoId().withMessage('Valid question ID required'),
  handleValidation,
];

module.exports = {
  validateSignup,
  validateLogin,
  validateQuestionGen,
  validateCompanyGen,
  validateCodeSubmission,
  handleValidation,
};

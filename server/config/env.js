require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/placement-prep',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || 'https://ce.judge0.com',
    apiKey: process.env.JUDGE0_API_KEY || '',
    apiHost: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

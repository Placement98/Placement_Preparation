require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

function parseCloudinaryUrl(value) {
  if (!value) return {};

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'cloudinary:') return {};

    return {
      apiKey: decodeURIComponent(parsed.username || ''),
      apiSecret: decodeURIComponent(parsed.password || ''),
      cloudName: parsed.hostname || '',
    };
  } catch {
    return {};
  }
}

const cloudinaryUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI
    || process.env.MONGO_URI
    || process.env.MONGODB_URI_LOCAL
    || 'mongodb://localhost:27017/placement-prep',
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
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || cloudinaryUrl.cloudName || '',
    apiKey: process.env.CLOUDINARY_API_KEY || cloudinaryUrl.apiKey || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || cloudinaryUrl.apiSecret || '',
    profileFolder: process.env.CLOUDINARY_PROFILE_FOLDER || 'placement-prep/profiles',
  },
  email: {
    host: process.env.EMAIL_HOST || process.env.BREVO_SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.BREVO_SMTP_PORT, 10) || 587,
    user: process.env.EMAIL_USER || process.env.BREVO_SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.BREVO_SMTP_PASS || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

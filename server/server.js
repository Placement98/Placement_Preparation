const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const testRoutes = require('./routes/test');
const codeRoutes = require('./routes/code');
const analysisRoutes = require('./routes/analysis');
const emailRoutes = require('./routes/email');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/test', testRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`\n🚀 Server running on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`📋 API docs: http://localhost:${config.port}/api/health\n`);
  });
};

startServer().catch(console.error);

module.exports = app;

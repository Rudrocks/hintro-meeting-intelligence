require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { getDb } = require('./src/db/database');
const traceMiddleware = require('./src/middleware/trace');
const errorHandler = require('./src/middleware/errorHandler');
const { startReminderScheduler } = require('./src/jobs/reminderJob');
const swaggerSpec = require('./src/utils/swagger');
const logger = require('./src/utils/logger');

const authRoutes = require('./src/routes/auth');
const meetingRoutes = require('./src/routes/meetings');
const analysisRoutes = require('./src/routes/analysis');
const actionItemRoutes = require('./src/routes/actionItems');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Trace-Id');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(traceMiddleware);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Evaluation endpoint
app.get('/api/evaluation', (req, res) => {
  res.json({
    traceId: res.locals.traceId,
    success: true,
    data: {
      candidateName: 'Rudrakshh S',
      email: 'candidate@example.com',
      repositoryUrl: 'https://github.com/candidate/hintro-meeting-intelligence',
      deployedUrl: process.env.DEPLOYED_URL || `http://localhost:${PORT}`,
      externalIntegration: 'Discord Webhook',
      features: [
        'JWT Authentication',
        'Meeting Management with Pagination',
        'AI Analysis via Gemini (Grounded with Citations)',
        'Hallucination Prevention',
        'Action Item Management',
        'Overdue Detection',
        'Scheduled Reminder Job (node-cron)',
        'Discord Webhook Integration',
        'Swagger/OpenAPI Documentation',
        'Structured Logging with Trace IDs',
        'Unified API Response Format',
        'Global Error Handling',
        'Input Validation (Zod)',
      ],
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meetings', analysisRoutes);
app.use('/api/action-items', actionItemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    traceId: res.locals.traceId,
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    await getDb();
    app.listen(PORT, () => {
      logger.info({ msg: `Server running on port ${PORT}` });
      logger.info({ msg: `Swagger docs: http://localhost:${PORT}/api-docs` });
    });
    startReminderScheduler();
  } catch (err) {
    logger.error({ msg: 'Failed to start server', error: err.message });
    process.exit(1);
  }
}

start();

module.exports = app;

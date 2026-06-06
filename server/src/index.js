/**
 * @module index
 * @description Express server entrypoint for the Weather Insurance Portal API.
 * Configures middleware, routes, and starts the HTTP server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const { initDatabase, closeDatabase } = require('./db/database');
const { createLogger } = require('./utils/logger');

const weatherRoutes = require('./routes/weather');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const thresholdRoutes = require('./routes/thresholds');

const logger = createLogger('server');
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Serve static client build in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// API documentation
const swaggerDocument = require('../../docs/openapi.json');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api/weather', weatherRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/thresholds', thresholdRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

// Start server
if (require.main === module) {
  initDatabase();
  const server = app.listen(PORT, () => {
    logger.info(`Weather Insurance Portal API running on port ${PORT}`);
  });

  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
      closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;

// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { config } from './config';
import { UserService } from './services/userService';
import { AuthController } from './controllers/authController';
import { errorHandler } from './middleware/errorHandler';
import { loginRateLimiter, generalRateLimiter } from './middleware/rateLimiter';

async function startServer() {
  const app = express();

  // Create database pool
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }

  // Initialize services and controllers
  const userService = new UserService(pool);
  const authController = new AuthController(userService);

  // Basic middleware
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  // Apply general rate limiter to all routes
  app.use(generalRateLimiter);

  // Add new reset password routes
  app.post('/auth/password-reset-request', authController.requestPasswordReset);
  app.post('/auth/password-reset', authController.resetPassword);

  // Routes with specific rate limiters
  app.post('/auth/register', loginRateLimiter, authController.register);
  app.post('/auth/login', loginRateLimiter, authController.login);
  app.get('/auth/verify', authController.verifyToken);

  // Error handling
  app.use(errorHandler);

  // Start server
  app.listen(config.port, () => {
    console.log(`Auth service listening on port ${config.port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
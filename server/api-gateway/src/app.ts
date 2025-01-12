import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import mlRouter from './routes/ml';
import analyticsRouter from './routes/analytics';

export const createApp = (): Express => {
  const app = express();

  // Basic middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // Routes
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/ml', mlRouter);
  app.use('/analytics', analyticsRouter);

  // Error handling
  app.use(errorHandler);

  return app;
};
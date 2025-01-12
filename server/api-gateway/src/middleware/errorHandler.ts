// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

declare module 'express' {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }

export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  }

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};




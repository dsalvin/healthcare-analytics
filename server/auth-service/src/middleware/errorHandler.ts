// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AuthError, ValidationError, DatabaseError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({
      status: 'error',
      message: error.message
    });
  }

  if (error instanceof DatabaseError) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service unavailable'
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};
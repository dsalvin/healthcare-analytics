// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { config } from '../config';

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port
  }
});

redisClient.connect().catch(err => {
  console.error('Redis connection error:', err);
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Login rate limiter: 5 attempts per minute per IP
const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_limit',
  points: 5, // 5 attempts
  duration: 60, // per 60 seconds
  blockDuration: 60 * 15 // Block for 15 minutes if limit reached
});

// General API rate limiter: 100 requests per minute per IP
const apiLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'api_limit',
  points: 100, // 100 requests
  duration: 60 // per 60 seconds
});

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    await loginLimiter.consume(clientIp);
    next();
  } catch (rejRes) {
    const rateLimiterRes = rejRes as RateLimiterRes;
    if (rateLimiterRes.remainingPoints <= 0) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        waitTimeInSeconds: Math.round(rateLimiterRes.msBeforeNext / 1000) || 0
      });
    }
    next(rejRes);
  }
};

export const generalRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    await apiLimiter.consume(clientIp);
    next();
  } catch (rejRes) {
    const rateLimiterRes = rejRes as RateLimiterRes;
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      waitTimeInSeconds: Math.round(rateLimiterRes.msBeforeNext / 1000) || 0
    });
  }
};
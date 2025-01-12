// src/utils/jwt.ts
  import jwt from 'jsonwebtoken';
  import { TokenPayload } from '../types/auth';
  import { config } from '../config';
  
  export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: '24h',
    });
  };
  
  export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  };
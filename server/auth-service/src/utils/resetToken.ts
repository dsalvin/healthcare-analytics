// src/utils/resetToken.ts
import crypto from 'crypto';
import { config } from '../config';

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashResetToken = (token: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${token}${config.jwtSecret}`)
    .digest('hex');
};
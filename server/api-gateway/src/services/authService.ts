import { config } from '../config';
import { logger } from '../utils/logger';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export const verifyToken = async (token: string): Promise<DecodedToken> => {
  try {
    const response = await fetch(`${config.services.auth}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json() as DecodedToken;
    return data;
  } catch (error) {
    logger.error('Token verification failed:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};
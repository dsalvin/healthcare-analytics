// src/services/userService.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User } from '../types/auth';
import { DatabaseError } from '../utils/errors';
import { generateResetToken, hashResetToken } from '../utils/resetToken';

export class UserService {
  constructor(private pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Error finding user', error);
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    try {
      const result = await this.pool.query(
        `INSERT INTO users (
          email, password, role, first_name, last_name
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          userData.email,
          hashedPassword,
          userData.role,
          userData.firstName,
          userData.lastName,
        ]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Error creating user', error);
    }
  }

  async validatePassword(
    inputPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  async createPasswordReset(email: string): Promise<string> {
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      await this.pool.query(
        `UPDATE users 
         SET reset_token = $1, 
             reset_token_expires = $2 
         WHERE email = $3`,
        [hashedToken, resetExpiry, email]
      );

      return resetToken; // Return unhashed token for email
    } catch (error) {
      throw new DatabaseError('Error creating password reset', error);
    }
  }

  async verifyResetToken(token: string): Promise<User | null> {
    const hashedToken = hashResetToken(token);

    try {
      const result = await this.pool.query(
        `SELECT * FROM users 
         WHERE reset_token = $1 
         AND reset_token_expires > NOW()`,
        [hashedToken]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Error verifying reset token', error);
    }
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await this.pool.query(
        `UPDATE users 
         SET password = $1,
             reset_token = NULL,
             reset_token_expires = NULL
         WHERE id = $2`,
        [hashedPassword, userId]
      );
    } catch (error) {
      throw new DatabaseError('Error resetting password', error);
    }
  }
}
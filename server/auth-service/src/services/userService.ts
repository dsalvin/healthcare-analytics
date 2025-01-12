// src/services/userService.ts
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User } from '../types/auth';
import { ProfileUpdateData, MedicalProfile } from '../types/profile';
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

  async updateProfile(userId: string, data: ProfileUpdateData): Promise<User> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build dynamic update query
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${this.toSnakeCase(key)} = $${valueIndex}`);
          values.push(value);
          valueIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(userId);
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Error updating profile', error);
    }
  }

  async updateMedicalProfile(userId: string, data: MedicalProfile): Promise<User> {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Update basic profile
        const user = await this.updateProfile(userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          specialization: data.specialization,
          department: data.department
        });

        // Update medical specific fields
        if (data.certifications) {
          await client.query(
            'UPDATE medical_staff SET certifications = $1 WHERE user_id = $2',
            [data.certifications, userId]
          );
        }

        if (data.licenseNumber || data.yearsOfExperience) {
          await client.query(
            `UPDATE medical_staff 
             SET license_number = COALESCE($1, license_number),
                 years_of_experience = COALESCE($2, years_of_experience)
             WHERE user_id = $3`,
            [data.licenseNumber, data.yearsOfExperience, userId]
          );
        }

        await client.query('COMMIT');
        return user;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new DatabaseError('Error updating medical profile', error);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      
      if (!user.rows[0]) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );
    } catch (error) {
      throw new DatabaseError('Error changing password', error);
    }
  }

  async getFullProfile(userId: string): Promise<User> {
    try {
      const result = await this.pool.query(
        `SELECT u.*, 
                ms.license_number, 
                ms.years_of_experience,
                ms.certifications
         FROM users u
         LEFT JOIN medical_staff ms ON u.id = ms.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (!result.rows[0]) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Error fetching profile', error);
    }
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
// src/controllers/authController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { EmailService } from '../services/emailService';
import { generateToken, verifyToken } from '../utils/jwt';
import { AuthError, ValidationError } from '../utils/errors';
import { validateLoginInput, validateRegistrationInput, validatePasswordResetInput } from '../utils/validation';

export class AuthController {
  private emailService: EmailService;

  constructor(private userService: UserService) {
    this.emailService = new EmailService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = validateLoginInput(req.body);

      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new AuthError('Invalid credentials');
      }

      const isValidPassword = await this.userService.validatePassword(
        password,
        user.password
      );

      if (!isValidPassword) {
        throw new AuthError('Invalid credentials');
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = validateRegistrationInput(req.body);

      const existingUser = await this.userService.findByEmail(userData.email);
      if (existingUser) {
        throw new ValidationError('Email already exists');
      }

      const user = await this.userService.createUser(userData);

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new AuthError('No token provided');
      }

      const decoded = verifyToken(token);
      const user = await this.userService.findByEmail(decoded.email);

      if (!user) {
        throw new AuthError('User not found');
      }

      res.json({
        userId: user.id,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({ error: error.message });
      } else {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      console.log('Password reset requested for email:', email);

      if (!email || typeof email !== 'string') {
        throw new ValidationError('Valid email is required');
      }

      const user = await this.userService.findByEmail(email);
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        // Don't reveal whether the email exists
        res.json({ message: 'If the email exists, a reset link will be sent' });
        return;
      }

      const resetToken = await this.userService.createPasswordReset(email);
      console.log('Reset token generated:', resetToken);
      
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      console.log('Reset email sent (mock)');

      res.json({ message: 'If the email exists, a reset link will be sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = validatePasswordResetInput(req.body);

      const user = await this.userService.verifyResetToken(token);
      if (!user) {
        throw new AuthError('Invalid or expired reset token');
      }

      await this.userService.resetPassword(user.id, newPassword);
      await this.emailService.sendPasswordResetConfirmation(user.email);

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
      }
    }
  };
}
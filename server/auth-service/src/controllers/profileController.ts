// src/controllers/profileController.ts
import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ValidationError } from '../utils/errors';
import { validateProfileUpdate, validatePasswordChange } from '../utils/validation';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class ProfileController {
  constructor(private userService: UserService) {}

  getProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User not authenticated');
      }

      const profile = await this.userService.getFullProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  };

  updateProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User not authenticated');
      }

      const updateData = validateProfileUpdate(req.body);
      
      let updatedProfile;
      // Check both user and role existence before using
      if (req.user?.role === 'doctor' || req.user?.role === 'staff') {
        updatedProfile = await this.userService.updateMedicalProfile(req.user.id, updateData);
      } else {
        updatedProfile = await this.userService.updateProfile(req.user.id, updateData);
      }

      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    }
  };

  changePassword = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User not authenticated');
      }

      const { currentPassword, newPassword } = validatePasswordChange(req.body);
      
      await this.userService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
      }
    }
  };
}
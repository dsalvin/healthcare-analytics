// src/utils/validation.ts
import { ValidationError } from './errors';

interface LoginInput {
  email: string;
  password: string;
}

interface RegistrationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'doctor' | 'staff';
}

export const validateLoginInput = (data: any): LoginInput => {
  if (!data.email || typeof data.email !== 'string') {
    throw new ValidationError('Valid email is required');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new ValidationError('Password is required');
  }

  if (data.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  return {
    email: data.email.toLowerCase(),
    password: data.password
  };
};


export const validateRegistrationInput = (data: any): RegistrationInput => {
  const validRoles = ['admin', 'doctor', 'staff'];
  
  if (!data.email || typeof data.email !== 'string') {
    throw new ValidationError('Valid email is required');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new ValidationError('Password is required');
  }

  if (data.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  if (!data.firstName || typeof data.firstName !== 'string') {
    throw new ValidationError('First name is required');
  }

  if (!data.lastName || typeof data.lastName !== 'string') {
    throw new ValidationError('Last name is required');
  }

  if (!data.role || !validRoles.includes(data.role)) {
    throw new ValidationError('Valid role is required (admin, doctor, or staff)');
  }

  return {
    email: data.email.toLowerCase(),
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role
  };
};

export const validatePasswordResetInput = (data: any) => {
  if (!data.token || typeof data.token !== 'string') {
    throw new ValidationError('Valid reset token is required');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string') {
    throw new ValidationError('New password is required');
  }

  if (data.newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  return {
    token: data.token,
    newPassword: data.newPassword
  };
};
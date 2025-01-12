// src/types/profile.ts
export interface ProfileUpdateData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    specialization?: string;
    department?: string;
  }
  
  export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
  }
  
  // Medical staff specific fields
  export interface MedicalProfile extends ProfileUpdateData {
    licenseNumber?: string;
    yearsOfExperience?: number;
    certifications?: string[];
  }
  
  // Response types
  export interface ProfileResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    certifications?: string[];
    createdAt: Date;
    updatedAt: Date;
  }
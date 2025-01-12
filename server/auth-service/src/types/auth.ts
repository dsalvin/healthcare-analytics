// src/types/auth.ts
export interface User {
    id: string;
    email: string;
    password: string;
    role: 'admin' | 'doctor' | 'staff';
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
  }
  
  
  
  
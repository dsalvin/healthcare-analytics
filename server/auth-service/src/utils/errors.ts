// src/utils/errors.ts
export class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  }
  
  export class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  }
  
  export class DatabaseError extends Error {
    constructor(message: string, public originalError: unknown) {
      super(message);
      this.name = 'DatabaseError';
    }
  }
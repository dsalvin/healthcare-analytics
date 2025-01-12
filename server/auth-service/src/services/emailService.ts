// src/services/emailService.ts
export class EmailService {
    async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
      // In production, this would send a real email
      // For now, we'll log it prominently
      console.log('\n========== PASSWORD RESET TOKEN ==========');
      console.log('Email:', email);
      console.log('Reset Token:', resetToken);
      console.log('Reset Link:', `http://localhost:3000/reset-password?token=${resetToken}`);
      console.log('==========================================\n');
    }
  
    async sendPasswordResetConfirmation(email: string): Promise<void> {
      console.log('\n========== PASSWORD RESET CONFIRMATION ==========');
      console.log('Password reset confirmation email would be sent to:', email);
      console.log('===============================================\n');
    }
  }
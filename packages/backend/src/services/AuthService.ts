import { User } from '../types';
import admin from '../config/firebase';
import { UserService } from './UserService';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

export class AuthService {
  private userService: UserService;
  private transporter: Transporter;

  constructor() {
    this.userService = new UserService();
    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "2e98526b84ba6f",
        pass: "157b12c2e090e9"
      },
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('SMTP server is ready');
      }
    });
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (!decodedToken.email) {
        console.error('No email in decoded token');
        return null;
      }

      const user = await this.userService.findOrCreateUser(decodedToken.email);
      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  async register(email: string, password: string) {
    try {
      // Create user in Firebase
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: false
      });

      // Create user in our database
      const user = await this.userService.findOrCreateUser(email);

      // Generate verification link
      const actionCodeSettings = {
        url: process.env.FRONTEND_URL + '/verify-email',
        handleCodeInApp: true
      };

      const verificationLink = await admin.auth()
        .generateEmailVerificationLink(email, actionCodeSettings);

      // Send verification email using Mailtrap
      await this.sendVerificationEmail(email, verificationLink);

      // Create custom token for client
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      return {
        token: customToken,
        user: {
          id: user.id,
          email: user.email
        },
        message: 'Verification email sent. Please check your inbox.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  private async sendVerificationEmail(email: string, verificationLink: string) {
    try {
      console.log('Attempting to send email to:', email);

      const mailOptions = {
        from: '"Todo App" <from@example.com>',
        to: email,
        subject: 'Verify your email',
        html: `
          <h1>Email Verification</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>If you didn't create an account, you can ignore this email.</p>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info);
    } catch (error) {
      console.error('Error sending verification email:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
      throw new Error('Failed to send verification email');
    }
  }

  async login(email: string, password: string) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      if (!userRecord.emailVerified) {
        throw new Error('Email not verified');
      }

      const user = await this.userService.findOrCreateUser(email);

      return {
        user: {
          id: user.id,
          email: user.email
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const user = await this.userService.findOrCreateUser(userRecord.email!);

      return {
        firebaseUser: userRecord,
        user: {
          id: user.id,
          email: user.email
        }
      };
    } catch (error) {
      throw new Error('User not found');
    }
  }
}

// Export a singleton instance
const authService = new AuthService();

// Export the verifyToken function for middleware
export const verifyToken = (token: string) => authService.verifyToken(token); 
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { validateToken, validateEmail, validateAuth } from '../validations/authValidation';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response) {
    try {
      const { error, value } = validateAuth(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await this.authService.register(value.email, value.password);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  login = async (req: Request, res: Response) => {
    try {
      console.log('Login request received:', req.body); // Debug log
      console.log('Request headers:', req.headers); // Debug log

      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      console.log('Login successful, sending response:', result); // Debug log
      res.json(result);
    } catch (error) {
      console.error('Login error:', error); // Debug log
      res.status(401).json({ error: error });
    }
  };

  async verifyToken(req: Request, res: Response) {
    try {
      const { error, value } = validateToken(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await this.authService.verifyToken(value.token);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getUserByEmail(req: Request, res: Response) {
    try {
      const { error, value } = validateEmail(req.params);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await this.authService.getUserByEmail(value.email);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
} 
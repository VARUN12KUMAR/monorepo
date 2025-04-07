import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/AuthService';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Auth middleware - headers:', req.headers); // Debug log
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No Bearer token found'); // Debug log
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token); // Debug log
    
    const user = await verifyToken(token);
    
    if (!user) {
      console.log('Token verification failed'); // Debug log
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Token verified, user:', user); // Debug log
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}; 
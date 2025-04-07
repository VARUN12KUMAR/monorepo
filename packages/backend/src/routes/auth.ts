import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/verify-token', (req, res) => authController.verifyToken(req, res));

// Protected routes (you might want to add authMiddleware here)
router.get('/user/:email', (req, res) => authController.getUserByEmail(req, res));

export default router; 
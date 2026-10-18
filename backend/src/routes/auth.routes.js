import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  currentUser
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'LOGIN_RATE_LIMITED',
      message: 'Too many login attempts. Please try again in 15 minutes.'
    }
  }
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, currentUser);

export default router;

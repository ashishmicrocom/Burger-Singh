import express from 'express';
import {
  login,
  register,
  logout,
  getMe,
  updatePassword
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

// Admin only routes
router.post('/register', protect, authorize('super_admin'), register);

export default router;

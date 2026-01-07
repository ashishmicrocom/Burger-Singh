import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getDashboardStats,
  getApplications,
  approveApplication,
  rejectApplication
} from '../controllers/dashboardController.js';

const router = express.Router();

// All routes are protected (any authenticated user)
router.use(protect);

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/applications', getApplications);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);

export default router;

import express from 'express';
import { 
  getFieldCoachStats, 
  getApplications, 
  getApplicationById,
  approveApplication,
  rejectApplication,
  getDeactivationRequests,
  approveDeactivation,
  rejectDeactivation
} from '../controllers/fieldCoachController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected and require field_coach role
router.use(protect);
router.use(authorize('field_coach'));

// Dashboard stats
router.get('/stats', getFieldCoachStats);

// Applications management
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications/:id/approve', approveApplication);
router.post('/applications/:id/reject', rejectApplication);

// Deactivation requests
router.get('/deactivations', getDeactivationRequests);
router.put('/deactivations/:id/approve', approveDeactivation);
router.put('/deactivations/:id/reject', rejectDeactivation);

export default router;

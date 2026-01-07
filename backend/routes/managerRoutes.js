import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
  getManagerStats,
  getOnboardings,
  getEmployees,
  requestDeactivation,
  getDeactivationRequests
} from '../controllers/managerController.js';

const router = express.Router();

// All routes are protected and require store_manager role
router.use(protect);
router.use(authorize('store_manager'));

// Stats
router.get('/stats', getManagerStats);

// Onboardings
router.get('/onboardings', getOnboardings);

// Employees
router.get('/employees', getEmployees);
router.post('/employees/:id/deactivate', requestDeactivation);

// Deactivation requests
router.get('/deactivations', getDeactivationRequests);

export default router;

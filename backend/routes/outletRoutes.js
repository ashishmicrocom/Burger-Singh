import express from 'express';
import {
  getAllOutlets,
  getOutletById,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  toggleOutletStatus,
  bulkImportOutlets
} from '../controllers/outletController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllOutlets);

// Admin only routes (specific routes BEFORE dynamic :id routes)
router.post('/bulk-import', protect, authorize('super_admin'), bulkImportOutlets);
router.post('/', protect, authorize('super_admin'), createOutlet);

// Dynamic routes (must come after specific routes)
router.get('/:id', getOutletById);
router.put('/:id', protect, authorize('super_admin'), updateOutlet);
router.patch('/:id/toggle', protect, authorize('super_admin'), toggleOutletStatus);
router.delete('/:id', protect, authorize('super_admin'), deleteOutlet);

export default router;

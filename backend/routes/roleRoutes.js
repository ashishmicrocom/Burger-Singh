import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roleController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllRoles);
router.get('/:id', getRoleById);

// Admin only routes
router.post('/', protect, authorize('super_admin'), createRole);
router.put('/:id', protect, authorize('super_admin'), updateRole);
router.delete('/:id', protect, authorize('super_admin'), deleteRole);

export default router;

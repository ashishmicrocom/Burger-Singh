import express from 'express';
import {
  saveDraft,
  getDraft,
  uploadDocuments,
  submitApplication,
  getAllApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  sendApprovalEmail,
  approveWithToken,
  rejectWithToken,
  getPendingApprovals,
  checkApprovalToken,
  upload
} from '../controllers/onboardingController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/draft', saveDraft);
router.get('/draft/:phone', getDraft);
router.post('/:id/upload', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificates', maxCount: 1 }, // Legacy field
  { name: 'educationCertificate', maxCount: 1 },
  { name: 'experienceDocument', maxCount: 1 },
  { name: 'idDocuments', maxCount: 1 },
  { name: 'panDocument', maxCount: 1 }
]), uploadDocuments);
router.post('/:id/submit', submitApplication);

// Token-based approval/rejection (No auth required, token validates the request)
router.get('/:id/approve-with-token', approveWithToken);
router.get('/:id/reject-with-token', rejectWithToken);
router.get('/:id/check-token', checkApprovalToken);

// Protected routes - Managers, Field Coaches, Admins
router.get('/', protect, authorize('store_manager', 'field_coach', 'super_admin'), getAllApplications);
router.get('/:id', protect, authorize('store_manager', 'field_coach', 'super_admin'), getApplicationById);
router.get('/pending/approvals', protect, authorize('field_coach', 'super_admin'), getPendingApprovals);

// Field Coach & Admin only
router.put('/:id/approve', protect, authorize('field_coach', 'super_admin'), approveApplication);
router.put('/:id/reject', protect, authorize('field_coach', 'super_admin'), rejectApplication);

// Approval workflow - Send email to Field Coach
router.post('/:id/send-approval-email', protect, authorize('super_admin', 'store_manager'), sendApprovalEmail);

export default router;

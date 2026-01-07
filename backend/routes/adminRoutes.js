import express from 'express';
import { 
  getAdminStats, 
  getAllEmployees, 
  getEmployeeById, 
  exportEmployees,
  exportEmployeesJSON,
  getFieldCoaches,
  getStoreManagers,
  createFieldCoach,
  createStoreManager,
  updateUser,
  deleteUser,
  terminateEmployee,
  deactivateEmployee,
  rehireEmployee,
  getDeactivationRequests,
  generateExportLink
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected and require super_admin role
router.use(protect);
router.use(authorize('super_admin'));

// Dashboard stats
router.get('/stats', getAdminStats);

// Employee management
router.get('/employees', getAllEmployees);
router.get('/employees/export/csv', exportEmployees);
router.get('/employees/export/json', exportEmployeesJSON);
router.post('/generate-export-link', generateExportLink);
router.get('/employees/:id', getEmployeeById);
router.post('/employees/:id/terminate', terminateEmployee);
router.post('/employees/:id/deactivate', deactivateEmployee);
router.post('/employees/:id/rehire', rehireEmployee);

// Deactivation requests
router.get('/deactivations', getDeactivationRequests);

// Field coaches management
router.get('/field-coaches', getFieldCoaches);
router.post('/users/field-coach', createFieldCoach);

// Store managers management
router.get('/users/store-managers', getStoreManagers);
router.post('/users/store-manager', createStoreManager);

// User management (update/delete)
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;

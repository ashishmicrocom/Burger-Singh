import express from 'express';
import { getEmployeeByKey } from '../controllers/publicController.js';
import { publicExportEmployees } from '../controllers/adminController.js';

const router = express.Router();

// Public employee data access by key
router.get('/employee/:key', getEmployeeByKey);

// Public export with token
router.get('/export-employees/:token', publicExportEmployees);

export default router;

import express from 'express';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  sendEmailOTP,
  verifyEmailOTP
} from '../controllers/otpController.js';

const router = express.Router();

// Phone OTP routes
router.post('/send-phone', sendPhoneOTP);
router.post('/verify-phone', verifyPhoneOTP);

// Email OTP routes
router.post('/send-email', sendEmailOTP);
router.post('/verify-email', verifyEmailOTP);

export default router;

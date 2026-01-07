import OTP from '../models/OTP.js';
import asyncHandler from 'express-async-handler';
import { sendOTPEmail } from '../utils/emailService.js';
import { sendOTPSMS } from '../utils/smsService.js';

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP to phone
// @route   POST /api/otp/send-phone
// @access  Public
export const sendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  // Validate phone format (10 digits)
  if (!/^\d{10}$/.test(phone)) {
    res.status(400);
    throw new Error('Invalid phone number format');
  }

  // Check for recent OTP (rate limiting - 1 OTP per minute)
  const recentOTP = await OTP.findOne({
    contact: phone,
    type: 'phone',
    createdAt: { $gte: new Date(Date.now() - 60000) } // Last 1 minute
  });

  if (recentOTP) {
    res.status(429);
    throw new Error('Please wait 1 minute before requesting another OTP');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

  // Delete old OTPs for this contact
  await OTP.deleteMany({ contact: phone, type: 'phone' });

  // Save new OTP (use default 000000 if SMS not configured)
  const otpToSave = (!process.env.DV_API_KEY) 
    ? '000000' 
    : otp;
  
  await OTP.create({
    contact: phone,
    type: 'phone',
    otp: otpToSave,
    expiresAt
  });

  // Send SMS
  try {
    await sendOTPSMS(phone, otp);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // seconds
    });
  } catch (error) {
    console.error('SMS sending failed:', error);
    res.status(500);
    throw new Error('Failed to send OTP. Please try again.');
  }
});

// @desc    Verify phone OTP
// @route   POST /api/otp/verify-phone
// @access  Public
export const verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400);
    throw new Error('Phone number and OTP are required');
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({
    contact: phone,
    type: 'phone'
  }).sort({ createdAt: -1 }); // Get latest

  if (!otpRecord) {
    res.status(400);
    throw new Error('OTP not found or expired');
  }

  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(400);
    throw new Error('OTP has expired');
  }

  // Check attempts (max 3)
  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(400);
    throw new Error('Maximum attempts exceeded. Please request a new OTP');
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining`);
  }

  // Mark as verified and delete
  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({
    success: true,
    verified: true,
    message: 'Phone number verified successfully'
  });
});

// @desc    Send OTP to email
// @route   POST /api/otp/send-email
// @access  Public
export const sendEmailOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Validate email format
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Check for recent OTP (rate limiting - 1 OTP per minute)
  const recentOTP = await OTP.findOne({
    contact: email.toLowerCase(),
    type: 'email',
    createdAt: { $gte: new Date(Date.now() - 60000) }
  });

  if (recentOTP) {
    res.status(429);
    throw new Error('Please wait 1 minute before requesting another OTP');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

  // Delete old OTPs for this contact
  await OTP.deleteMany({ contact: email.toLowerCase(), type: 'email' });

  // Save new OTP
  await OTP.create({
    contact: email.toLowerCase(),
    type: 'email',
    otp,
    expiresAt
  });

  // Send Email
  try {
    await sendOTPEmail(email, otp);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // seconds
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500);
    throw new Error('Failed to send OTP. Please try again.');
  }
});

// @desc    Verify email OTP
// @route   POST /api/otp/verify-email
// @access  Public
export const verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  // Find OTP record
  const otpRecord = await OTP.findOne({
    contact: email.toLowerCase(),
    type: 'email'
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    res.status(400);
    throw new Error('OTP not found or expired');
  }

  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(400);
    throw new Error('OTP has expired');
  }

  // Check attempts (max 3)
  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ _id: otpRecord._id });
    res.status(400);
    throw new Error('Maximum attempts exceeded. Please request a new OTP');
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    res.status(400);
    throw new Error(`Invalid OTP. ${3 - otpRecord.attempts} attempts remaining`);
  }

  // Mark as verified and delete
  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({
    success: true,
    verified: true,
    message: 'Email verified successfully'
  });
});

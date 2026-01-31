import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import outletRoutes from './routes/outletRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fieldCoachRoutes from './routes/fieldCoachRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://burgersingfrontend.kamaaupoot.in',
    'https://burgersingfrontbackend.kamaaupoot.in',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory (MUST be before API routes)
const uploadsPath = path.join(__dirname, 'uploads');
console.log(`📁 Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper content type for images and PDFs
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
      res.setHeader('Content-Type', 'image/' + path.extname(filePath).substring(1));
    }
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/field-coach', fieldCoachRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/public', publicRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler (only for non-static routes)
app.use((req, res) => {
  // Don't send JSON error for static file requests
  if (req.path.startsWith('/uploads/')) {
    res.status(404).send('File not found');
  } else {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});
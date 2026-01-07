import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['phone', 'email'],
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete when expired
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for quick lookups
otpSchema.index({ contact: 1, type: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

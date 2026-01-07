import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema({
  // Step 1: Basic Details
  fullName: {
    type: String,
    trim: true
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', '']
  },
  
  // Step 2: Contact Details
  phone: {
    type: String,
    trim: true
  },
  phoneOtpVerified: {
    type: Boolean,
    default: false
  },
  phone2: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  emailOtpVerified: {
    type: Boolean,
    default: false
  },
  currentAddress: {
    type: String,
    trim: true
  },
  permanentAddress: {
    type: String,
    trim: true
  },
  sameAsCurrentAddress: {
    type: Boolean,
    default: false
  },
  
  // Step 3: Education
  qualification: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  educationStatus: {
    type: String,
    enum: ['completed', 'pursuing', '']
  },
  
  // Step 4: Work Experience
  totalExperience: {
    type: String
  },
  lastDesignation: {
    type: String,
    trim: true
  },
  
  // Step 5: Other Relevant Information
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', '']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  tshirtSize: {
    type: String,
    enum: ['S', 'M', 'L', 'XL', 'XXL', '']
  },
  lowerSize: {
    type: String,
    enum: ['28', '30', '32', '34', '36', '38', '40', '']
  },
  aadhaarNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // Step 6: Verification
  aadhaarVerified: {
    type: Boolean,
    default: false
  },
  panVerified: {
    type: Boolean,
    default: false
  },
  
  // Step 7: Employment Details
  covidVaccinated: {
    type: Boolean,
    default: false
  },
  hepatitisVaccinated: {
    type: Boolean,
    default: false
  },
  typhoidVaccinated: {
    type: Boolean,
    default: false
  },
  designation: {
    type: String,
    trim: true
  },
  dateOfJoining: {
    type: Date
  },
  fieldCoach: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  storeName: {
    type: String,
    trim: true
  },
  
  // Role & Outlet
  role: {
    type: String,
    required: [true, 'Role is required']
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Outlet is required'],
    ref: 'Outlet'
  },
  
  // Documents
  photo: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  educationCertificate: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  experienceDocument: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  idDocuments: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  panDocument: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  
  // Legacy fields (for backward compatibility)
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  certificates: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'submitted', 'pending_approval', 'approved', 'rejected', 'terminated'],
    default: 'draft'
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 7
  },
  
  // Approval tracking
  submittedAt: {
    type: Date
  },
  approvalEmailSentAt: {
    type: Date
  },
  approvalToken: {
    type: String,
    // Token is hashed for security
  },
  approvalTokenExpiry: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  lmsUserId: {
    type: String
  },
  lmsCreatedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionDate: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Employee status tracking (after approval)
  employeeStatus: {
    type: String,
    enum: ['active', 'deactivation_pending', 'deactivated', 'terminated'],
    default: 'active'
  },
  deactivationReason: {
    type: String
  },
  deactivationRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivationRequestedAt: {
    type: Date
  },
  deactivationApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deactivationApprovedAt: {
    type: Date
  },
  
  // Termination tracking
  terminationReason: {
    type: String
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  terminatedAt: {
    type: Date
  },
  
  // Employment history (for re-applicants)
  previousEmployment: [{
    role: String,
    outlet: {
      name: String,
      code: String
    },
    joinDate: Date,
    endDate: Date,
    endReason: String, // 'terminated', 'resigned', 'deactivated'
    terminationReason: String,
    performanceNotes: String
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  // Unique employee key for public data access
  employeeKey: {
    type: String,
    unique: true,
    sparse: true
  }
  
}, {
  timestamps: true
});

// Generate unique employee key when status becomes approved
onboardingSchema.pre('save', function() {
  if (this.status === 'approved' && !this.employeeKey) {
    // Generate unique key: EMP-{timestamp}-{random}
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.employeeKey = `EMP-${timestamp}-${random}`.toUpperCase();
  }
});

// Index for quick lookups
onboardingSchema.index({ phone: 1 });
onboardingSchema.index({ status: 1 });
onboardingSchema.index({ outlet: 1, status: 1 });
onboardingSchema.index({ createdAt: -1 });
onboardingSchema.index({ employeeKey: 1 });

const Onboarding = mongoose.model('Onboarding', onboardingSchema);

export default Onboarding;

import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateApprovalToken, verifyApprovalToken } from '../utils/tokenService.js';
import { sendApprovalRequestEmail, sendApprovalConfirmationEmails, sendRejectionEmail, sendApplicationSubmissionEmail, sendCandidateApprovalEmail, sendCandidateRejectionEmail } from '../utils/emailService.js';
import { createLMSUser } from '../utils/lmsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/onboarding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Create or update onboarding draft
// @route   POST /api/onboarding/draft
// @access  Public
export const saveDraft = async (req, res) => {
  try {
    console.log('=== SAVE DRAFT REQUEST ===');
    console.log('Received body:', JSON.stringify(req.body, null, 2));
    
    const {
      // Step 1: Basic Details
      fullName,
      dob,
      gender,
      
      // Step 2: Contact Details
      phone,
      phoneOtpVerified,
      phone2,
      email,
      emailOtpVerified,
      currentAddress,
      permanentAddress,
      sameAsCurrentAddress,
      
      // Step 3: Education
      qualification,
      specialization,
      educationStatus,
      
      // Step 4: Work Experience
      totalExperience,
      lastDesignation,
      
      // Step 5: Other Information
      maritalStatus,
      bloodGroup,
      tshirtSize,
      lowerSize,
      aadhaarNumber,
      panNumber,
      
      // Step 6: Verification
      aadhaarVerified,
      panVerified,
      
      // Step 7: Employment Details
      covidVaccinated,
      hepatitisVaccinated,
      typhoidVaccinated,
      designation,
      dateOfJoining,
      fieldCoach,
      department,
      storeName,
      
      // Documents
      photo,
      aadhaarDocument,
      panDocument,
      educationDocument,
      bankPassbook,
      policeClearanceCertificate,
      policeVerificationLetter,
      experienceLetter,
      addressProof,
      
      // Role & Outlet
      role,
      outlet,
      currentStep
    } = req.body;
    
    console.log('Employment Details extracted:', {
      covidVaccinated,
      hepatitisVaccinated,
      typhoidVaccinated,
      designation,
      dateOfJoining,
      fieldCoach,
      department,
      storeName
    });
    
    console.log('Employment field types:', {
      covidVaccinated: typeof covidVaccinated,
      hepatitisVaccinated: typeof hepatitisVaccinated,
      typhoidVaccinated: typeof typhoidVaccinated,
      designation: typeof designation,
      dateOfJoining: typeof dateOfJoining,
      fieldCoach: typeof fieldCoach,
      department: typeof department,
      storeName: typeof storeName
    });
    
    console.log('🔍 RAW req.body employment fields:', {
      covidVaccinated: req.body.covidVaccinated,
      hepatitisVaccinated: req.body.hepatitisVaccinated,
      typhoidVaccinated: req.body.typhoidVaccinated,
      designation: req.body.designation,
      dateOfJoining: req.body.dateOfJoining,
      department: req.body.department
    });

    // Check if draft exists for this phone
    let onboarding = await Onboarding.findOne({ phone, status: 'draft' });

    // Validate and convert outlet to ObjectId if needed
    let outletId = outlet;
    if (outlet && typeof outlet === 'string') {
      // Check if it's a valid ObjectId format
      if (outlet.match(/^[0-9a-fA-F]{24}$/)) {
        outletId = outlet;
      } else {
        // It might be an outlet code, try to find it
        const outletDoc = await Outlet.findOne({ code: outlet });
        if (outletDoc) {
          outletId = outletDoc._id;
        }
      }
    }

    const draftData = {
      // Step 1: Basic Details
      fullName,
      dob,
      gender,
      
      // Step 2: Contact Details
      phone,
      phoneOtpVerified,
      phone2,
      email,
      emailOtpVerified,
      currentAddress,
      permanentAddress,
      sameAsCurrentAddress,
      
      // Step 3: Education
      qualification,
      specialization,
      educationStatus,
      
      // Step 4: Work Experience
      totalExperience,
      lastDesignation,
      
      // Step 5: Other Information
      maritalStatus,
      bloodGroup,
      tshirtSize,
      lowerSize,
      aadhaarNumber,
      panNumber,
      
      // Step 6: Verification
      aadhaarVerified,
      panVerified,
      
      // Step 7: Employment Details
      covidVaccinated,
      hepatitisVaccinated,
      typhoidVaccinated,
      designation,
      dateOfJoining,
      fieldCoach,
      department,
      storeName,
      
      // Documents
      photo,
      aadhaarDocument,
      panDocument,
      educationDocument,
      bankPassbook,
      policeClearanceCertificate,
      policeVerificationLetter,
      experienceLetter,
      addressProof,
      
      // Role & Outlet
      role,
      outlet: outletId,
      currentStep,
      status: 'draft',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
    
    console.log('📦 draftData created - Employment fields:', {
      covidVaccinated: draftData.covidVaccinated,
      hepatitisVaccinated: draftData.hepatitisVaccinated,
      typhoidVaccinated: draftData.typhoidVaccinated,
      designation: draftData.designation,
      dateOfJoining: draftData.dateOfJoining,
      department: draftData.department
    });

    if (onboarding) {
      // Update existing draft - explicitly set all fields to ensure updates work
      Object.keys(draftData).forEach(key => {
        onboarding[key] = draftData[key];
      });
      await onboarding.save();
      console.log(`✅ Updated draft ${onboarding._id} for ${onboarding.fullName}`);
    } else {
      // Create new draft
      onboarding = await Onboarding.create(draftData);
      console.log(`✅ Created new draft ${onboarding._id} for ${onboarding.fullName}`);
    }
    
    console.log('Saved onboarding details:', {
      id: onboarding._id,
      name: onboarding.fullName,
      outlet: onboarding.outlet,
      role: onboarding.role,
      status: onboarding.status,
      employmentDetails: {
        covidVaccinated: onboarding.covidVaccinated,
        hepatitisVaccinated: onboarding.hepatitisVaccinated,
        typhoidVaccinated: onboarding.typhoidVaccinated,
        designation: onboarding.designation,
        dateOfJoining: onboarding.dateOfJoining,
        fieldCoach: onboarding.fieldCoach,
        department: onboarding.department,
        storeName: onboarding.storeName
      }
    });

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      onboarding: {
        id: onboarding._id,
        currentStep: onboarding.currentStep
      }
    });

  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving draft',
      error: error.message
    });
  }
};

// @desc    Get draft by phone
// @route   GET /api/onboarding/draft/:phone
// @access  Public
export const getDraft = async (req, res) => {
  try {
    const { phone } = req.params;

    const onboarding = await Onboarding.findOne({ phone, status: 'draft' })
      .populate('outlet', 'name code city')
      .select('-photo -certificates');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'No draft found'
      });
    }

    res.status(200).json({
      success: true,
      onboarding
    });

  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching draft'
    });
  }
};

// @desc    Upload documents
// @route   POST /api/onboarding/:id/upload
// @access  Public
export const uploadDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding application not found'
      });
    }

    // Handle photo upload
    if (req.files?.photo) {
      const photo = req.files.photo[0];
      onboarding.photo = {
        filename: photo.filename,
        path: photo.path.replace(/\\/g, '/').split('uploads/')[1] || photo.path,
        mimetype: photo.mimetype,
        size: photo.size
      };
    }

    // Handle education certificate upload
    if (req.files?.educationCertificate) {
      const certificate = req.files.educationCertificate[0];
      onboarding.educationCertificate = {
        filename: certificate.filename,
        path: certificate.path.replace(/\\/g, '/').split('uploads/')[1] || certificate.path,
        mimetype: certificate.mimetype,
        size: certificate.size
      };
    }

    // Handle experience document upload
    if (req.files?.experienceDocument) {
      const document = req.files.experienceDocument[0];
      onboarding.experienceDocument = {
        filename: document.filename,
        path: document.path.replace(/\\/g, '/').split('uploads/')[1] || document.path,
        mimetype: document.mimetype,
        size: document.size
      };
    }

    // Handle ID documents upload (Aadhaar/PAN copy)
    if (req.files?.idDocuments) {
      const document = req.files.idDocuments[0];
      onboarding.idDocuments = {
        filename: document.filename,
        path: document.path.replace(/\\/g, '/').split('uploads/')[1] || document.path,
        mimetype: document.mimetype,
        size: document.size
      };
    }

    // Handle PAN document upload
    if (req.files?.panDocument) {
      const document = req.files.panDocument[0];
      onboarding.panDocument = {
        filename: document.filename,
        path: document.path.replace(/\\/g, '/').split('uploads/')[1] || document.path,
        mimetype: document.mimetype,
        size: document.size
      };
    }

    // Handle legacy certificates upload (for backward compatibility)
    if (req.files?.certificates) {
      const certificate = req.files.certificates[0];
      onboarding.certificates = {
        filename: certificate.filename,
        path: certificate.path.replace(/\\/g, '/').split('uploads/')[1] || certificate.path,
        mimetype: certificate.mimetype,
        size: certificate.size
      };
    }

    await onboarding.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      files: {
        photo: onboarding.photo,
        educationCertificate: onboarding.educationCertificate,
        experienceDocument: onboarding.experienceDocument,
        idDocuments: onboarding.idDocuments,
        panDocument: onboarding.panDocument,
        certificates: onboarding.certificates
      }
    });

  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading documents',
      error: error.message
    });
  }
};

// @desc    Submit onboarding application
// @route   POST /api/onboarding/:id/submit
// @access  Public
export const submitApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const onboarding = await Onboarding.findById(id).populate({
      path: 'outlet',
      select: 'name code email fieldCoach',
      populate: {
        path: 'fieldCoach',
        select: 'name email'
      }
    });

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding application not found'
      });
    }

    if (onboarding.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been submitted'
      });
    }

    // Validate outlet is assigned
    if (!onboarding.outlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet must be selected before submission'
      });
    }

    // Validate required fields
    if (!onboarding.aadhaarVerified) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar verification is required'
      });
    }

    if (!onboarding.photo) {
      return res.status(400).json({
        success: false,
        message: 'Photo is required'
      });
    }

    // Check for previous employment history based on Aadhaar number
    if (onboarding.aadhaarNumber) {
      const previousEmployee = await Onboarding.findOne({
        aadhaarNumber: onboarding.aadhaarNumber,
        employeeStatus: 'terminated',
        _id: { $ne: onboarding._id } // Exclude current application
      })
      .sort({ terminatedAt: -1 }) // Get most recent terminated record
      .populate('outlet', 'name code');

      // If found, copy employment history to new application
      if (previousEmployee && previousEmployee.previousEmployment && previousEmployee.previousEmployment.length > 0) {
        onboarding.previousEmployment = previousEmployee.previousEmployment;
        console.log(`ℹ️  Found previous employment history for ${onboarding.fullName} based on Aadhaar (${previousEmployee.previousEmployment.length} records)`);
      }
    }

    // Update status
    onboarding.status = 'submitted';
    onboarding.submittedAt = new Date();
    onboarding.currentStep = 4;

    await onboarding.save();

    console.log(`✅ Application submitted: ${onboarding._id}`);
    console.log(`   - Name: ${onboarding.fullName}`);
    console.log(`   - Outlet: ${onboarding.outlet.name} (${onboarding.outlet.code})`);
    console.log(`   - Field Coach: ${onboarding.outlet.fieldCoach?.name || 'NOT ASSIGNED'}`);

    // Send application details email to candidate
    try {
      if (onboarding.email) {
        await sendApplicationSubmissionEmail(onboarding.email, {
          applicationId: onboarding._id,
          fullName: onboarding.fullName,
          email: onboarding.email,
          phone: onboarding.phone,
          phone2: onboarding.phone2,
          dob: onboarding.dob,
          gender: onboarding.gender,
          maritalStatus: onboarding.maritalStatus,
          bloodGroup: onboarding.bloodGroup,
          currentAddress: onboarding.currentAddress,
          qualification: onboarding.qualification,
          specialization: onboarding.specialization,
          totalExperience: onboarding.totalExperience,
          lastDesignation: onboarding.lastDesignation,
          storeName: onboarding.storeName,
          designation: onboarding.designation,
          department: onboarding.department,
          dateOfJoining: onboarding.dateOfJoining,
          tshirtSize: onboarding.tshirtSize,
          lowerSize: onboarding.lowerSize,
          covidVaccinated: onboarding.covidVaccinated,
          hepatitisVaccinated: onboarding.hepatitisVaccinated,
          typhoidVaccinated: onboarding.typhoidVaccinated,
          aadhaarNumber: onboarding.aadhaarNumber,
          panNumber: onboarding.panNumber,
          aadhaarVerified: onboarding.aadhaarVerified,
          phoneOtpVerified: onboarding.phoneOtpVerified,
          emailOtpVerified: onboarding.emailOtpVerified,
          submittedAt: onboarding.submittedAt
        });
        console.log(`✅ Application details email sent to candidate: ${onboarding.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send application details email (non-critical):', emailError.message);
      // Don't fail the submission if email fails
    }

    // Trigger approval email to Field Coach (if configured)
    try {
      const fieldCoachEmail = onboarding.outlet?.fieldCoach?.email || req.body.fieldCoachEmail;
      
      if (fieldCoachEmail) {
        // Generate approval token
        const { token, hashedToken, expiryTime } = generateApprovalToken();

        // Save token to database
        onboarding.approvalToken = hashedToken;
        onboarding.approvalTokenExpiry = expiryTime;
        onboarding.status = 'pending_approval';
        onboarding.approvalEmailSentAt = new Date();

        await onboarding.save();

        // Create approval/rejection links
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const approvalLink = `${baseUrl}/approval/${id}?token=${token}&action=approve`;
        const rejectionLink = `${baseUrl}/approval/${id}?token=${token}&action=reject`;

        // Send approval email
        await sendApprovalRequestEmail(
          fieldCoachEmail,
          {
            fullName: onboarding.fullName,
            email: onboarding.email,
            phone: onboarding.phone,
            phone2: onboarding.phone2,
            dob: onboarding.dob,
            gender: onboarding.gender,
            maritalStatus: onboarding.maritalStatus,
            bloodGroup: onboarding.bloodGroup,
            qualification: onboarding.qualification,
            specialization: onboarding.specialization,
            totalExperience: onboarding.totalExperience,
            lastDesignation: onboarding.lastDesignation,
            storeName: onboarding.storeName,
            designation: onboarding.designation,
            department: onboarding.department,
            dateOfJoining: onboarding.dateOfJoining,
            tshirtSize: onboarding.tshirtSize,
            lowerSize: onboarding.lowerSize,
            covidVaccinated: onboarding.covidVaccinated,
            hepatitisVaccinated: onboarding.hepatitisVaccinated,
            typhoidVaccinated: onboarding.typhoidVaccinated,
            aadhaarVerified: onboarding.aadhaarVerified,
            phoneOtpVerified: onboarding.phoneOtpVerified,
            emailOtpVerified: onboarding.emailOtpVerified
          },
          approvalLink,
          rejectionLink
        );

        console.log(`✅ Approval email triggered for ${onboarding._id} to ${fieldCoachEmail}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send approval email (non-critical):', emailError.message);
      // Don't fail the submission if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully. Field Coach approval email sent.',
      onboarding: {
        id: onboarding._id,
        status: onboarding.status,
        submittedAt: onboarding.submittedAt,
        approvalEmailSentAt: onboarding.approvalEmailSentAt
      }
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application',
      error: error.message
    });
  }
};

// @desc    Get all onboarding applications
// @route   GET /api/onboarding
// @access  Private (Managers, Field Coaches, Admins)
export const getAllApplications = async (req, res) => {
  try {
    const { status, outlet, role, page = 1, limit = 20 } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (outlet) filter.outlet = outlet;
    if (role) filter.role = role;

    const skip = (page - 1) * limit;

    const applications = await Onboarding.find(filter)
      .populate('outlet', 'name code city')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Onboarding.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
};

// @desc    Get onboarding application by ID
// @route   GET /api/onboarding/:id
// @access  Private
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Onboarding.findById(id)
      .populate('outlet', 'name code city address phone')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
};

// @desc    Approve onboarding application
// @route   PUT /api/onboarding/:id/approve
// @access  Private (Field Coach, Admin)
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Onboarding.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = 'approved';
    application.approvedBy = req.user.id;
    application.approvedAt = new Date();

    await application.save();

    // Send approval notification email to candidate
    try {
      if (application.email) {
        await sendCandidateApprovalEmail(application.email, {
          fullName: application.fullName,
          storeName: application.storeName,
          designation: application.designation,
          department: application.department,
          dateOfJoining: application.dateOfJoining
        });
        console.log(`✅ Approval notification sent to candidate: ${application.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send approval email to candidate (non-critical):', emailError.message);
      // Don't fail the approval if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      application
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving application'
    });
  }
};

// @desc    Reject onboarding application
// @route   PUT /api/onboarding/:id/reject
// @access  Private (Field Coach, Admin)
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const application = await Onboarding.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = 'rejected';
    application.rejectedBy = req.user.id;
    application.rejectedAt = new Date();
    application.rejectionReason = reason;

    await application.save();

    // Send rejection notification email to candidate
    try {
      if (application.email) {
        await sendCandidateRejectionEmail(application.email, {
          fullName: application.fullName,
          storeName: application.storeName
        }, reason);
        console.log(`✅ Rejection notification sent to candidate: ${application.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send rejection email to candidate (non-critical):', emailError.message);
      // Don't fail the rejection if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected',
      application
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting application'
    });
  }
};

// ==================== APPROVAL WORKFLOW ENDPOINTS ====================

/**
 * @desc    Send approval email to Field Coach after application submission
 * @route   POST /api/onboarding/:id/send-approval-email
 * @access  Private (Admin/Manager)
 */
export const sendApprovalEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldCoachEmail } = req.body;

    // Validate input
    if (!fieldCoachEmail) {
      return res.status(400).json({
        success: false,
        message: 'Field Coach email is required'
      });
    }

    const onboarding = await Onboarding.findById(id).populate('outlet', 'name code email');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if approval email already sent
    if (onboarding.approvalEmailSentAt) {
      return res.status(400).json({
        success: false,
        message: 'Approval email already sent for this application'
      });
    }

    // Generate approval token
    const { token, hashedToken, expiryTime } = generateApprovalToken();

    // Save token to database
    onboarding.approvalToken = hashedToken;
    onboarding.approvalTokenExpiry = expiryTime;
    onboarding.status = 'pending_approval';
    onboarding.approvalEmailSentAt = new Date();

    await onboarding.save();

    // Create approval/rejection links
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const approvalLink = `${baseUrl}/api/onboarding/${id}/approve-with-token?token=${token}`;
    const rejectionLink = `${baseUrl}/api/onboarding/${id}/reject-with-token?token=${token}`;

    // Send approval email
    await sendApprovalRequestEmail(
      fieldCoachEmail,
      {
        fullName: onboarding.fullName,
        email: onboarding.email,
        phone: onboarding.phone,
        dob: onboarding.dob,
        gender: onboarding.gender,
        storeName: onboarding.storeName,
        designation: onboarding.designation,
        department: onboarding.department,
        dateOfJoining: onboarding.dateOfJoining,
        aadhaarVerified: onboarding.aadhaarVerified,
        phoneOtpVerified: onboarding.phoneOtpVerified,
        emailOtpVerified: onboarding.emailOtpVerified
      },
      approvalLink,
      rejectionLink
    );

    res.status(200).json({
      success: true,
      message: 'Approval email sent to Field Coach successfully',
      data: {
        onboardingId: onboarding._id,
        status: onboarding.status,
        emailSentTo: fieldCoachEmail,
        tokenExpiry: expiryTime
      }
    });

  } catch (error) {
    console.error('Send approval email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send approval email',
      error: error.message
    });
  }
};

/**
 * @desc    Approve application via token link (from email)
 * @route   GET /api/onboarding/:id/approve-with-token
 * @access  Public (Token validation required)
 */
export const approveWithToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Approval token is missing'
      });
    }

    const onboarding = await Onboarding.findById(id).populate('outlet', 'name code email fieldCoach');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify token
    const isValidToken = verifyApprovalToken(token, onboarding.approvalToken, onboarding.approvalTokenExpiry);

    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired approval token'
      });
    }

    // Approve application
    onboarding.status = 'approved';
    onboarding.approvedAt = new Date();
    onboarding.approvalToken = null;
    onboarding.approvalTokenExpiry = null;

    await onboarding.save();

    // Create LMS user
    const lmsResult = await createLMSUser({
      fullName: onboarding.fullName,
      email: onboarding.email,
      phone: onboarding.phone,
      designation: onboarding.designation,
      storeName: onboarding.storeName,
      storeCode: onboarding.outlet?.code,
      fieldCoachEmail: onboarding.outlet?.fieldCoach?.email || '',
      dateOfJoining: onboarding.dateOfJoining
    });

    if (lmsResult.success) {
      onboarding.lmsUserId = lmsResult.lmsUserId;
      onboarding.lmsCreatedAt = new Date();
      await onboarding.save();
    }

    // Send approval notification email to candidate
    try {
      if (onboarding.email) {
        await sendCandidateApprovalEmail(onboarding.email, {
          fullName: onboarding.fullName,
          storeName: onboarding.storeName,
          designation: onboarding.designation,
          department: onboarding.department,
          dateOfJoining: onboarding.dateOfJoining
        });
        console.log(`✅ Approval notification sent to candidate: ${onboarding.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send approval email to candidate:', emailError.message);
      // Don't fail the approval if email fails
    }

    // Send confirmation emails to stakeholders
    try {
      const recipients = [
        onboarding.outlet?.email, // Store email
        process.env.TRAINING_TEAM_EMAIL || 'training@burgsingh.com' // Training team
      ].filter(Boolean);

      if (recipients.length > 0) {
        await sendApprovalConfirmationEmails(
          recipients,
          onboarding.fullName,
          onboarding.storeName
        );
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send stakeholder confirmation emails:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully! LMS account created.',
      data: {
        onboardingId: onboarding._id,
        status: onboarding.status,
        lmsUserId: onboarding.lmsUserId,
        lmsMessage: lmsResult.message
      }
    });

  } catch (error) {
    console.error('Approve with token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  }
};

/**
 * @desc    Reject application via token link (from email)
 * @route   GET /api/onboarding/:id/reject-with-token
 * @access  Public (Token validation required)
 */
export const rejectWithToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token, reason } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Rejection token is missing'
      });
    }

    const onboarding = await Onboarding.findById(id).populate('outlet', 'email');

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify token
    const isValidToken = verifyApprovalToken(token, onboarding.approvalToken, onboarding.approvalTokenExpiry);

    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Reject application
    onboarding.status = 'rejected';
    onboarding.rejectedAt = new Date();
    onboarding.rejectionReason = reason || 'Not provided';
    onboarding.approvalToken = null;
    onboarding.approvalTokenExpiry = null;

    await onboarding.save();

    // Send rejection notification email to candidate
    try {
      if (onboarding.email) {
        await sendCandidateRejectionEmail(onboarding.email, {
          fullName: onboarding.fullName,
          storeName: onboarding.storeName
        }, onboarding.rejectionReason);
        console.log(`✅ Rejection notification sent to candidate: ${onboarding.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send rejection email to candidate:', emailError.message);
      // Don't fail the rejection if email fails
    }

    // Send rejection emails to stakeholders
    try {
      const recipients = [
        onboarding.outlet?.email, // Store email
        process.env.TRAINING_TEAM_EMAIL || 'training@burgsingh.com' // Training team
      ].filter(Boolean);

      if (recipients.length > 0) {
        await sendRejectionEmail(
          recipients,
          onboarding.fullName,
          onboarding.storeName,
          onboarding.rejectionReason
        );
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send stakeholder rejection emails:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected and notifications sent',
      data: {
        onboardingId: onboarding._id,
        status: onboarding.status,
        rejectionReason: onboarding.rejectionReason
      }
    });

  } catch (error) {
    console.error('Reject with token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting application',
      error: error.message
    });
  }
};

/**
 * @desc    Get pending approvals for Field Coach
 * @route   GET /api/onboarding/pending/approvals
 * @access  Private (Field Coach)
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const { fieldCoachEmail } = req.query;

    if (!fieldCoachEmail) {
      return res.status(400).json({
        success: false,
        message: 'Field Coach email is required'
      });
    }

    const approvals = await Onboarding.find({
      status: 'pending_approval',
      approvalTokenExpiry: { $gt: new Date() }
    })
      .populate('outlet', 'name code email fieldCoach')
      .sort({ approvalEmailSentAt: -1 });

    res.status(200).json({
      success: true,
      count: approvals.length,
      approvals
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals'
    });
  }
};

/**
 * @desc    Check if approval token is valid
 * @route   GET /api/onboarding/:id/check-token
 * @access  Public
 */
export const checkApprovalToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is missing'
      });
    }

    const onboarding = await Onboarding.findById(id);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const isValidToken = verifyApprovalToken(token, onboarding.approvalToken, onboarding.approvalTokenExpiry);

    res.status(200).json({
      success: true,
      isValid: isValidToken,
      applicationStatus: onboarding.status,
      expiryTime: onboarding.approvalTokenExpiry
    });

  } catch (error) {
    console.error('Check token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating token'
    });
  }
};

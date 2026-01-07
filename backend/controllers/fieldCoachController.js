import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';
import User from '../models/User.js';
import { sendCandidateApprovalEmail, sendCandidateRejectionEmail } from '../utils/emailService.js';

// @desc    Get field coach dashboard stats
// @route   GET /api/field-coach/stats
// @access  Private (field_coach only)
export const getFieldCoachStats = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id');
    const outletIds = assignedOutlets.map(o => o._id);

    // Total applications (submitted/pending_approval for assigned outlets)
    const totalApplications = await Onboarding.countDocuments({
      outlet: { $in: outletIds },
      status: { $in: ['submitted', 'pending_approval', 'approved', 'rejected'] }
    });

    // Pending review
    const pendingReview = await Onboarding.countDocuments({
      outlet: { $in: outletIds },
      status: { $in: ['submitted', 'pending_approval'] }
    });

    // Approved
    const approved = await Onboarding.countDocuments({
      outlet: { $in: outletIds },
      status: 'approved'
    });

    // Deactivation requests
    const deactivationRequests = await Onboarding.countDocuments({
      outlet: { $in: outletIds },
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    });

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        pendingReview,
        approved,
        deactivationRequests
      }
    });
  } catch (error) {
    console.error('Get field coach stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

// @desc    Get applications for field coach review
// @route   GET /api/field-coach/applications
// @access  Private (field_coach only)
export const getApplications = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;
    const { search, status } = req.query;

    console.log('\n🔍 Field Coach Applications Query:');
    console.log('   Coach ID:', fieldCoachId);
    console.log('   Coach:', req.user.name, '(' + req.user.email + ')');
    console.log('   Status filter:', status);
    console.log('   Search:', search);

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id name code');
    const outletIds = assignedOutlets.map(o => o._id);
    
    console.log('   Assigned outlets:', assignedOutlets.length);
    assignedOutlets.forEach(o => console.log('      -', o.name, '(' + o.code + ')'));

    let query = {
      outlet: { $in: outletIds },
      status: { $in: ['submitted', 'pending_approval', 'approved', 'rejected'] }
    };

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.status = { $in: ['submitted', 'pending_approval'] };
      } else {
        query.status = status;
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('   Query:', JSON.stringify(query, null, 2));

    const applications = await Onboarding.find(query)
      .populate('outlet', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    console.log('   Found applications:', applications.length);
    applications.forEach(app => console.log('      -', app.fullName, '(' + app.status + ')'));

    // Format applications for frontend
    const formattedApplications = applications.map(app => {
      // Show employeeStatus as primary status if deactivated or terminated
      let displayStatus = app.status === 'submitted' || app.status === 'pending_approval' ? 'pending' : app.status;
      if (app.employeeStatus === 'deactivated' || app.employeeStatus === 'terminated') {
        displayStatus = app.employeeStatus;
      }
      
      return {
      id: app._id,
      name: app.fullName,
      phone: app.phone,
      email: app.email,
      role: app.role || 'N/A',
      outlet: app.outlet?.name || 'N/A',
      outletCode: app.outlet?.code || 'N/A',
      submittedAt: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : '',
      status: displayStatus,
      employeeStatus: app.employeeStatus || 'active',
      aadhaarVerified: app.aadhaarVerified || false,
      panVerified: app.panVerified || false,
      dateOfBirth: app.dob ? new Date(app.dob).toISOString().split('T')[0] : '',
      qualification: app.qualification || 'Not provided',
      
      // Additional personal details
      gender: app.gender,
      phone2: app.phone2,
      phoneOtpVerified: app.phoneOtpVerified,
      emailOtpVerified: app.emailOtpVerified,
      currentAddress: app.currentAddress,
      permanentAddress: app.permanentAddress,
      
      // Education details
      specialization: app.specialization,
      educationStatus: app.educationStatus,
      
      // Work experience
      totalExperience: app.totalExperience,
      lastDesignation: app.lastDesignation,
      
      // Personal information
      maritalStatus: app.maritalStatus,
      bloodGroup: app.bloodGroup,
      tshirtSize: app.tshirtSize,
      lowerSize: app.lowerSize,
      aadhaarNumber: app.aadhaarNumber,
      panNumber: app.panNumber,
      
      // Employment details
      covidVaccinated: app.covidVaccinated,
      hepatitisVaccinated: app.hepatitisVaccinated,
      typhoidVaccinated: app.typhoidVaccinated,
      designation: app.designation,
      dateOfJoining: app.dateOfJoining ? new Date(app.dateOfJoining).toISOString().split('T')[0] : '',
      fieldCoach: app.fieldCoach,
      department: app.department,
      storeName: app.storeName,
      
      // Documents
      photo: app.photo,
      educationCertificate: app.educationCertificate,
      experienceDocument: app.experienceDocument,
      idDocuments: app.idDocuments,
      panDocument: app.panDocument,
      
      // Employment history (for re-applicants)
      previousEmployment: app.previousEmployment || [],
      hasEmploymentHistory: app.previousEmployment && app.previousEmployment.length > 0,
      
      // Legacy fields
      address: app.address,
      emergencyContact: app.emergencyContact,
      emergencyPhone: app.emergencyPhone,
      certificates: app.certificates
    };
    });

    res.status(200).json({
      success: true,
      applications: formattedApplications,
      total: formattedApplications.length
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// @desc    Get application by ID
// @route   GET /api/field-coach/applications/:id
// @access  Private (field_coach only)
export const getApplicationById = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;
    const applicationId = req.params.id;

    const application = await Onboarding.findById(applicationId)
      .populate('outlet', 'name code fieldCoach')
      .populate('role', 'name title')
      .lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify this application belongs to field coach's assigned outlets
    if (application.outlet?.fieldCoach?.toString() !== fieldCoachId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this application'
      });
    }

    const formattedApplication = {
      id: application._id,
      name: application.fullName,
      phone: application.phone,
      email: application.email,
      role: application.role || 'N/A',
      outlet: application.outlet?.name || 'N/A',
      outletCode: application.outlet?.code || 'N/A',
      submittedAt: application.createdAt ? new Date(application.createdAt).toISOString().split('T')[0] : '',
      status: application.status === 'submitted' || application.status === 'pending_approval' ? 'pending' : application.status,
      aadhaarVerified: application.aadhaarVerified || false,
      panVerified: application.panVerified || false,
      dateOfBirth: application.dob ? new Date(application.dob).toISOString().split('T')[0] : '',
      qualification: application.qualification || 'Not provided',
      address: application.address,
      emergencyContact: application.emergencyContact,
      emergencyPhone: application.emergencyPhone,
      photo: application.photo,
      certificates: application.certificates
    };

    res.status(200).json({
      success: true,
      application: formattedApplication
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// @desc    Approve application
// @route   POST /api/field-coach/applications/:id/approve
// @access  Private (field_coach only)
export const approveApplication = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;
    const applicationId = req.params.id;

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id');
    const outletIds = assignedOutlets.map(o => o._id.toString());

    const application = await Onboarding.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify this application belongs to field coach's assigned outlets
    if (!outletIds.includes(application.outlet.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve this application'
      });
    }

    // Check if already approved/rejected
    if (application.status === 'approved' || application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`
      });
    }

    // Update status to approved
    application.status = 'approved';
    application.approvedBy = fieldCoachId;
    application.approvalDate = new Date();
    await application.save();

    // Populate outlet details for email
    await application.populate('outlet');

    // Send approval email to candidate
    try {
      await sendCandidateApprovalEmail(
        application.email,
        {
          fullName: application.fullName,
          storeName: application.outlet?.name || application.storeName || 'Burger Singh',
          designation: application.designation || 'Team Member',
          department: application.department || 'Operations',
          dateOfJoining: application.dateOfJoining
        }
      );
      console.log('✅ Approval notification sent to candidate:', application.email);
      console.log('   Store:', application.outlet?.name || application.storeName);
      console.log('   Designation:', application.designation);
      console.log('   Date of Joining:', application.dateOfJoining);
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError.message);
      // Don't fail the approval if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully. LMS account will be created.',
      application: {
        id: application._id,
        status: 'approved',
        approvalDate: application.approvalDate
      }
    });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message
    });
  }
};

// @desc    Reject application
// @route   POST /api/field-coach/applications/:id/reject
// @access  Private (field_coach only)
export const rejectApplication = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;
    const applicationId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id');
    const outletIds = assignedOutlets.map(o => o._id.toString());

    const application = await Onboarding.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify this application belongs to field coach's assigned outlets
    if (!outletIds.includes(application.outlet.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject this application'
      });
    }

    // Check if already approved/rejected
    if (application.status === 'approved' || application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Application already ${application.status}`
      });
    }

    // Update status to rejected
    application.status = 'rejected';
    application.rejectedBy = fieldCoachId;
    application.rejectionReason = reason;
    application.rejectionDate = new Date();
    await application.save();

    // Populate outlet details for email
    await application.populate('outlet');

    // Send rejection email to candidate
    try {
      await sendCandidateRejectionEmail(
        application.email,
        {
          fullName: application.fullName,
          storeName: application.outlet?.name || 'Burger Singh'
        },
        reason
      );
      console.log('✅ Rejection notification sent to candidate:', application.email);
      console.log('   Reason:', reason);
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError.message);
      // Don't fail the rejection if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected successfully. Notification sent to store.',
      application: {
        id: application._id,
        status: 'rejected',
        rejectionDate: application.rejectionDate,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
};

// @desc    Get deactivation requests
// @route   GET /api/field-coach/deactivations
// @access  Private (field_coach only)
export const getDeactivationRequests = async (req, res) => {
  try {
    const fieldCoachId = req.user._id;

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id name code');
    const outletIds = assignedOutlets.map(o => o._id);

    // Find all deactivation pending employees from assigned outlets
    const deactivationRequests = await Onboarding.find({
      outlet: { $in: outletIds },
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    })
      .populate('outlet', 'name code')
      .populate('deactivationRequestedBy', 'name email')
      .sort({ deactivationRequestedAt: -1 })
      .lean();

    // Format the response
    const formattedRequests = deactivationRequests.map(req => ({
      id: req._id,
      employeeName: req.fullName,
      employeePhone: req.phone,
      name: req.fullName,
      phone: req.phone,
      email: req.email,
      role: req.role || 'N/A',
      designation: req.role || 'N/A',
      outlet: req.outlet?.name || 'N/A',
      outletCode: req.outlet?.code || 'N/A',
      dateOfJoining: req.dateOfJoining ? new Date(req.dateOfJoining).toLocaleDateString('en-GB') : (req.approvalDate ? new Date(req.approvalDate).toLocaleDateString('en-GB') : 'N/A'),
      requestedAt: req.deactivationRequestedAt ? new Date(req.deactivationRequestedAt).toLocaleDateString('en-GB') : 'N/A',
      requestedBy: req.deactivationRequestedBy?.name || 'Store Manager',
      reason: req.deactivationReason || 'No reason provided',
      status: 'pending' // Set to 'pending' for frontend filter
    }));

    res.status(200).json({
      success: true,
      deactivations: formattedRequests,
      total: formattedRequests.length
    });
  } catch (error) {
    console.error('Get deactivation requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deactivation requests',
      error: error.message
    });
  }
};

// @desc    Approve deactivation request
// @route   PUT /api/field-coach/deactivations/:id/approve
// @access  Private (field_coach only)
export const approveDeactivation = async (req, res) => {
  try {
    const { id } = req.params;
    const fieldCoachId = req.user._id;

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id');
    const outletIds = assignedOutlets.map(o => o._id);

    // Find the employee and verify they belong to assigned outlets
    const employee = await Onboarding.findOne({
      _id: id,
      outlet: { $in: outletIds },
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Deactivation request not found or already processed'
      });
    }

    // Update employee status to deactivated
    employee.employeeStatus = 'deactivated';
    employee.deactivationApprovedBy = fieldCoachId;
    employee.deactivationApprovedAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: `${employee.fullName} has been deactivated successfully`,
      data: {
        id: employee._id,
        name: employee.fullName,
        status: employee.employeeStatus
      }
    });
  } catch (error) {
    console.error('Approve deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve deactivation request',
      error: error.message
    });
  }
};

// @desc    Reject deactivation request
// @route   PUT /api/field-coach/deactivations/:id/reject
// @access  Private (field_coach only)
export const rejectDeactivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const fieldCoachId = req.user._id;

    // Get outlets assigned to this field coach
    const assignedOutlets = await Outlet.find({ fieldCoach: fieldCoachId }).select('_id');
    const outletIds = assignedOutlets.map(o => o._id);

    // Find the employee and verify they belong to assigned outlets
    const employee = await Onboarding.findOne({
      _id: id,
      outlet: { $in: outletIds },
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Deactivation request not found or already processed'
      });
    }

    // Reset employee status to active
    employee.employeeStatus = 'active';
    employee.deactivationReason = null;
    employee.deactivationRequestedBy = null;
    employee.deactivationRequestedAt = null;

    await employee.save();

    res.json({
      success: true,
      message: `Deactivation request for ${employee.fullName} has been rejected`,
      data: {
        id: employee._id,
        name: employee.fullName,
        status: employee.employeeStatus
      }
    });
  } catch (error) {
    console.error('Reject deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject deactivation request',
      error: error.message
    });
  }
};


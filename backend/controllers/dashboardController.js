import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    // If field coach, filter by assigned outlets
    if (userRole === 'field_coach') {
      const outlets = await Outlet.find({ fieldCoach: userId }).select('_id');
      const outletIds = outlets.map(outlet => outlet._id);
      query.outlet = { $in: outletIds };
    }
    // If store manager, filter by managed outlet
    else if (userRole === 'store_manager') {
      const outlet = await Outlet.findOne({ manager: userId });
      if (outlet) {
        query.outlet = outlet._id;
      }
    }
    // Super admin sees all

    const totalApplications = await Onboarding.countDocuments({ 
      ...query, 
      status: { $in: ['pending_approval', 'approved', 'rejected'] } 
    });
    
    const pendingReview = await Onboarding.countDocuments({ 
      ...query, 
      status: 'pending_approval' 
    });
    
    const approved = await Onboarding.countDocuments({ 
      ...query, 
      status: 'approved' 
    });
    
    const rejected = await Onboarding.countDocuments({ 
      ...query, 
      status: 'rejected' 
    });

    res.json({
      success: true,
      data: {
        totalApplications,
        pendingReview,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get applications list
// @route   GET /api/dashboard/applications
// @access  Private
export const getApplications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { search, status } = req.query;

    let query = { status: { $in: ['pending_approval', 'approved', 'rejected'] } };

    // If field coach, filter by assigned outlets
    if (userRole === 'field_coach') {
      const outlets = await Outlet.find({ fieldCoach: userId }).select('_id');
      const outletIds = outlets.map(outlet => outlet._id);
      query.outlet = { $in: outletIds };
    }
    // If store manager, filter by managed outlet
    else if (userRole === 'store_manager') {
      const outlet = await Outlet.findOne({ manager: userId });
      if (outlet) {
        query.outlet = outlet._id;
      }
    }
    // Super admin sees all

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.status = 'pending_approval';
      } else {
        query.status = status;
      }
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await Onboarding.find(query)
      .populate('outlet', 'name')
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    // Transform data to match frontend interface
    const formattedApplications = applications.map(app => ({
      id: app._id,
      name: app.fullName,
      phone: app.phone,
      role: app.role || 'N/A',
      outlet: app.outlet?.name || 'N/A',
      submittedAt: app.submittedAt ? new Date(app.submittedAt).toISOString().split('T')[0] : new Date(app.createdAt).toISOString().split('T')[0],
      status: app.status === 'pending_approval' ? 'pending' : app.status,
      aadhaarVerified: app.aadhaarVerified || false
    }));

    res.json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error in getApplications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Approve application
// @route   POST /api/dashboard/applications/:id/approve
// @access  Private
export const approveApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;

    // Find application
    const application = await Onboarding.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify user has permission to approve this application
    if (userRole === 'field_coach') {
      const outlet = await Outlet.findOne({ 
        _id: application.outlet, 
        fieldCoach: userId 
      });
      
      if (!outlet) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to approve this application'
        });
      }
    } else if (userRole === 'store_manager') {
      const outlet = await Outlet.findOne({ 
        _id: application.outlet, 
        manager: userId 
      });
      
      if (!outlet) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to approve this application'
        });
      }
    }

    // Update application status
    application.status = 'approved';
    application.approvedBy = userId;
    application.approvalDate = new Date();
    application.employeeStatus = 'active';
    
    await application.save();

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: {
        id: application._id,
        name: application.fullName,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('Error in approveApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  }
};

// @desc    Reject application
// @route   POST /api/dashboard/applications/:id/reject
// @access  Private
export const rejectApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find application
    const application = await Onboarding.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify user has permission to reject this application
    if (userRole === 'field_coach') {
      const outlet = await Outlet.findOne({ 
        _id: application.outlet, 
        fieldCoach: userId 
      });
      
      if (!outlet) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to reject this application'
        });
      }
    } else if (userRole === 'store_manager') {
      const outlet = await Outlet.findOne({ 
        _id: application.outlet, 
        manager: userId 
      });
      
      if (!outlet) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to reject this application'
        });
      }
    }

    // Update application status
    application.status = 'rejected';
    application.rejectedBy = userId;
    application.rejectionDate = new Date();
    application.rejectionReason = reason;
    
    await application.save();

    res.json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        id: application._id,
        name: application.fullName,
        status: 'rejected'
      }
    });
  } catch (error) {
    console.error('Error in rejectApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting application',
      error: error.message
    });
  }
};

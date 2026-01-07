import Onboarding from '../models/Onboarding.js';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

// @desc    Get manager stats for their outlet
// @route   GET /api/manager/stats
// @access  Private (store_manager)
export const getManagerStats = async (req, res) => {
  try {
    let outlet;

    // Check if this is an outlet login (direct outlet authentication)
    if (req.user.isOutlet) {
      outlet = await Outlet.findById(req.user.outletId);
    } else {
      // Regular manager user - find outlet by manager ID
      const managerId = req.user._id;
      outlet = await Outlet.findOne({ manager: managerId });
    }
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'No outlet found for this manager'
      });
    }

    // Get onboarding stats for this outlet (excluding draft and in_progress)
    const totalOnboardings = await Onboarding.countDocuments({ 
      outlet: outlet._id,
      status: { $nin: ['draft', 'in_progress'] }
    });
    const inProgress = await Onboarding.countDocuments({ 
      outlet: outlet._id, 
      status: 'in_progress' 
    });
    const pendingApproval = await Onboarding.countDocuments({ 
      outlet: outlet._id, 
      status: 'pending_approval' 
    });
    const completed = await Onboarding.countDocuments({ 
      outlet: outlet._id, 
      status: 'approved' 
    });

    res.json({
      success: true,
      data: {
        totalOnboardings,
        inProgress,
        pendingApproval,
        completed
      }
    });
  } catch (error) {
    console.error('Error in getManagerStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching manager stats',
      error: error.message
    });
  }
};

// @desc    Get onboardings for manager's outlet
// @route   GET /api/manager/onboardings
// @access  Private (store_manager)
export const getOnboardings = async (req, res) => {
  try {
    const { search, status } = req.query;
    let outlet;

    // Check if this is an outlet login (direct outlet authentication)
    if (req.user.isOutlet) {
      outlet = await Outlet.findById(req.user.outletId);
    } else {
      // Regular manager user - find outlet by manager ID
      const managerId = req.user._id;
      outlet = await Outlet.findOne({ manager: managerId });
    }
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'No outlet found for this manager'
      });
    }

    // Build query - exclude draft and in_progress records
    const query = { 
      outlet: outlet._id,
      status: { $nin: ['draft', 'in_progress'] }
    };
    
    if (status && status !== 'draft' && status !== 'in_progress') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const onboardings = await Onboarding.find(query)
      .populate('outlet', 'name')
      .populate('approvedBy', 'fullName')
      .populate('rejectedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to match frontend interface
    const formattedOnboardings = onboardings.map(onboarding => {
      // Show employeeStatus as primary status if deactivated or terminated
      let displayStatus = onboarding.status;
      if (onboarding.employeeStatus === 'deactivated' || onboarding.employeeStatus === 'terminated') {
        displayStatus = onboarding.employeeStatus;
      }
      
      return {
        id: onboarding._id,
        name: onboarding.fullName,
        role: onboarding.role || 'N/A',
        outlet: onboarding.outlet?.name || 'N/A',
        startedAt: onboarding.createdAt ? new Date(onboarding.createdAt).toISOString().split('T')[0] : 'N/A',
        status: displayStatus,
        employeeStatus: onboarding.employeeStatus || 'active'
      };
    });

    res.json({
      success: true,
      data: formattedOnboardings
    });
  } catch (error) {
    console.error('Error in getOnboardings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching onboardings',
      error: error.message
    });
  }
};

// @desc    Get employees for manager's outlet
// @route   GET /api/manager/employees
// @access  Private (store_manager)
export const getEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let outlet;

    // Check if this is an outlet login (direct outlet authentication)
    if (req.user.isOutlet) {
      outlet = await Outlet.findById(req.user.outletId);
    } else {
      // Regular manager user - find outlet by manager ID
      const managerId = req.user._id;
      outlet = await Outlet.findOne({ manager: managerId });
    }
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'No outlet found for this manager'
      });
    }

    // Build query for approved onboardings (employees) - exclude deactivated and terminated
    const query = { 
      outlet: outlet._id,
      status: 'approved',
      employeeStatus: { $nin: ['deactivated', 'terminated'] }
    };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Onboarding.find(query)
      .sort({ approvalDate: -1 })
      .lean();

    // Transform data to match frontend interface
    const formattedEmployees = employees.map(emp => ({
      id: emp._id,
      name: emp.fullName,
      phone: emp.phone,
      role: emp.role || 'N/A',
      dateOfJoining: emp.approvalDate ? new Date(emp.approvalDate).toISOString().split('T')[0] : 'N/A',
      status: emp.employeeStatus || 'active'
    }));

    res.json({
      success: true,
      data: formattedEmployees
    });
  } catch (error) {
    console.error('Error in getEmployees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

// @desc    Request employee deactivation
// @route   POST /api/manager/employees/:id/deactivate
// @access  Private (store_manager)
export const requestDeactivation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    let outlet;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Deactivation reason is required'
      });
    }

    // Check if this is an outlet login (direct outlet authentication)
    if (req.user.isOutlet) {
      outlet = await Outlet.findById(req.user.outletId);
    } else {
      // Regular manager user - find outlet by manager ID
      const managerId = req.user._id;
      outlet = await Outlet.findOne({ manager: managerId });
    }
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'No outlet found for this manager'
      });
    }

    // Find the employee and verify they belong to this outlet
    const employee = await Onboarding.findOne({ 
      _id: id, 
      outlet: outlet._id,
      status: 'approved'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or does not belong to your outlet'
      });
    }

    // Check if already pending deactivation
    if (employee.employeeStatus === 'deactivation_pending') {
      return res.status(400).json({
        success: false,
        message: 'Deactivation request already pending for this employee'
      });
    }

    // Update employee status to deactivation_pending
    employee.employeeStatus = 'deactivation_pending';
    employee.deactivationReason = reason;
    employee.deactivationRequestedBy = req.user._id;
    employee.deactivationRequestedAt = new Date();
    
    await employee.save();

    res.json({
      success: true,
      message: 'Deactivation request submitted successfully. Waiting for Field Coach approval.',
      data: {
        id: employee._id,
        name: employee.fullName,
        status: employee.employeeStatus
      }
    });
  } catch (error) {
    console.error('Error in requestDeactivation:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting deactivation request',
      error: error.message
    });
  }
};

// @desc    Get deactivation requests for manager's outlet
// @route   GET /api/manager/deactivations
// @access  Private (store_manager)
export const getDeactivationRequests = async (req, res) => {
  try {
    let outlet;

    // Check if this is an outlet login (direct outlet authentication)
    if (req.user.isOutlet) {
      outlet = await Outlet.findById(req.user.outletId);
    } else {
      // Regular manager user - find outlet by manager ID
      const managerId = req.user._id;
      outlet = await Outlet.findOne({ manager: managerId });
    }
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'No outlet found for this manager'
      });
    }

    // Find all employees with deactivation pending status
    const deactivationRequests = await Onboarding.find({
      outlet: outlet._id,
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    })
      .sort({ deactivationRequestedAt: -1 })
      .lean();

    // Transform data to match frontend interface
    const formattedRequests = deactivationRequests.map(req => ({
      id: req._id,
      name: req.fullName,
      phone: req.phone,
      role: req.role || 'N/A',
      dateOfJoining: req.approvalDate ? new Date(req.approvalDate).toISOString().split('T')[0] : 'N/A',
      status: req.employeeStatus
    }));

    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Error in getDeactivationRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deactivation requests',
      error: error.message
    });
  }
};

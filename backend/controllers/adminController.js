import User from '../models/User.js';
import Outlet from '../models/Outlet.js';
import Role from '../models/Role.js';
import Onboarding from '../models/Onboarding.js';
import crypto from 'crypto';

// In-memory store for export tokens (in production, use Redis or database)
const exportTokens = new Map();

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (super_admin only)
export const getAdminStats = async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.countDocuments();

    // Pending approvals count (onboarding applications)
    const pendingApprovals = await Onboarding.countDocuments({ 
      status: { $in: ['submitted', 'pending_approval'] } 
    });

    // Active outlets count
    const activeOutlets = await Outlet.countDocuments({ isActive: true });

    // Total roles count
    const totalRoles = await Role.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingApprovals,
        activeOutlets,
        totalRoles
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats',
      error: error.message
    });
  }
};

// @desc    Get all employees with advanced filtering
// @route   GET /api/admin/employees
// @access  Private (super_admin only)
export const getAllEmployees = async (req, res) => {
  try {
    const { 
      search, 
      store, 
      status, 
      fieldCoach, 
      tab,
      employeeStatus,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = {
      // Exclude draft and in_progress records to prevent showing incomplete applications
      status: { $nin: ['draft', 'in_progress'] }
    };

    // Tab-based filtering
    if (tab === 'terminated') {
      query.employeeStatus = 'terminated';
      // Don't filter by status - terminated employees can have status 'terminated' or 'approved'
      query.status = { $nin: ['draft', 'in_progress'] };
    } else if (tab === 'active') {
      query.status = 'approved';
      query.employeeStatus = { $in: ['active', null] }; // null for backwards compatibility
    } else if (tab === 'pending') {
      query.status = { $in: ['submitted', 'pending_approval'] };
    } else {
      // For 'all' tab or no tab specified, exclude drafts and in_progress
      query.status = { $nin: ['draft', 'in_progress'] };
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    // Store filter
    if (store && store !== 'all') {
      // Check if store is an ObjectId or a store code
      if (store.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId
        query.outlet = store;
      } else {
        // It's a store code, lookup the outlet first
        const outlet = await Outlet.findOne({ code: store }).select('_id');
        if (outlet) {
          query.outlet = outlet._id;
        } else {
          // No outlet found with this code, return empty results
          query.outlet = null;
        }
      }
    }

    // Status filter (if not using tab)
    if (status && status !== 'all' && !tab) {
      // Map frontend status to database status
      if (status === 'pending') {
        query.status = { $in: ['submitted', 'pending_approval', 'pending'] };
      } else {
        query.status = status;
      }
    }

    // Employee status filter
    if (employeeStatus && employeeStatus !== 'all') {
      query.employeeStatus = employeeStatus;
    }

    // Field coach filter
    if (fieldCoach && fieldCoach !== 'all') {
      // Check if fieldCoach is an ObjectId or a name
      if (fieldCoach.match(/^[0-9a-fA-F]{24}$/)) {
        // It's an ObjectId
        const outlets = await Outlet.find({ fieldCoach }).select('_id');
        query.outlet = { $in: outlets.map(o => o._id) };
      } else {
        // It's a name, lookup the user first
        const coach = await User.findOne({ name: fieldCoach }).select('_id');
        if (coach) {
          const outlets = await Outlet.find({ fieldCoach: coach._id }).select('_id');
          query.outlet = { $in: outlets.map(o => o._id) };
        } else {
          // No coach found with this name, return empty results
          query.outlet = { $in: [] };
        }
      }
    }

    // Additional tab-based filtering for special tabs
    if (tab === 'long-pending') {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      query.status = { $in: ['submitted', 'pending_approval'] };
      query.createdAt = { $lt: fiveDaysAgo };
    } else if (tab === 'missing-docs') {
      query.status = { $nin: ['draft', 'in_progress'] };
      query.$or = [
        { aadhaarVerified: false },
        { photo: { $exists: false } }
      ];
    } else if (tab === 'rehire') {
      // Show deactivated employees for rehire
      query.employeeStatus = 'deactivated';
      query.status = { $nin: ['draft', 'in_progress'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await Onboarding.find(query)
      .populate('outlet', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Onboarding.countDocuments(query);

    // Get field coach info for each employee
    const enrichedEmployees = await Promise.all(
      employees.map(async (emp) => {
        let fieldCoachName = '';
        if (emp.outlet) {
          const outlet = await Outlet.findById(emp.outlet._id).populate('fieldCoach', 'name');
          fieldCoachName = outlet?.fieldCoach?.name || '';
        }
        
        return {
          id: emp._id,
          name: emp.fullName,
          phone: emp.phone,
          email: emp.email,
          aadhaarNumber: emp.aadhaarNumber ? `XXXX-XXXX-${emp.aadhaarNumber.slice(-4)}` : '',
          panNumber: emp.panNumber || '',
          designation: emp.role || 'N/A',
          role: emp.role || 'N/A',
          store: emp.outlet?.name || 'N/A',
          storeCode: emp.outlet?.code || 'N/A',
          storeName: emp.outlet?.name || 'N/A',
          fieldCoach: fieldCoachName,
          dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-GB') : (emp.approvalDate ? new Date(emp.approvalDate).toLocaleDateString('en-GB') : new Date(emp.createdAt).toLocaleDateString('en-GB')),
          status: emp.status === 'submitted' || emp.status === 'pending_approval' ? 'pending' : emp.status,
          employeeStatus: emp.employeeStatus || 'active',
          aadhaarVerified: emp.aadhaarVerified || false,
          panVerified: emp.panVerified || false,
          createdAt: new Date(emp.createdAt).toLocaleDateString('en-GB'),
          
          // Field coach action tracking
          approvedBy: emp.approvedByFieldCoach || null,
          approvedByEmail: emp.approvedByFieldCoachEmail || null,
          approvalDate: emp.approvalDate,
          rejectedBy: emp.rejectedByFieldCoach || null,
          rejectedByEmail: emp.rejectedByFieldCoachEmail || null,
          rejectionDate: emp.rejectionDate,
          rejectionReason: emp.rejectionReason || null,
          deactivationApprovedBy: emp.deactivationApprovedByFieldCoach || null,
          deactivationApprovedByEmail: emp.deactivationApprovedByFieldCoachEmail || null,
          deactivationApprovedAt: emp.deactivationApprovedAt,
          
          // Personal Information
          gender: emp.gender || '',
          dateOfBirth: emp.dob ? new Date(emp.dob).toLocaleDateString('en-GB') : '',
          maritalStatus: emp.maritalStatus || '',
          bloodGroup: emp.bloodGroup || '',
          
          // Contact Information
          phone2: emp.phone2 || '',
          phoneOtpVerified: emp.phoneOtpVerified || false,
          emailOtpVerified: emp.emailOtpVerified || false,
          currentAddress: emp.currentAddress || '',
          permanentAddress: emp.permanentAddress || '',
          
          // Education
          qualification: emp.qualification || '',
          specialization: emp.specialization || '',
          educationStatus: emp.educationStatus || '',
          
          // Work Experience
          totalExperience: emp.totalExperience || '',
          lastDesignation: emp.lastDesignation || '',
          
          // Employment Details
          department: emp.department || '',
          
          // Uniform & Vaccination
          tshirtSize: emp.tshirtSize || '',
          lowerSize: emp.lowerSize || '',
          covidVaccinated: emp.covidVaccinated || false,
          hepatitisVaccinated: emp.hepatitisVaccinated || false,
          typhoidVaccinated: emp.typhoidVaccinated || false,
          
          // Documents
          photo: emp.photo,
          educationCertificate: emp.educationCertificate,
          experienceDocument: emp.experienceDocument,
          idDocuments: emp.idDocuments,
          panDocument: emp.panDocument,
          certificates: emp.certificates,
          
          // Employment History
          hasEmploymentHistory: emp.previousEmployment && emp.previousEmployment.length > 0,
          previousEmployment: emp.previousEmployment || [],
          
          // Deactivation/Termination Details
          deactivationReason: emp.deactivationReason || '',
          deactivationApprovedAt: emp.deactivationApprovedAt ? new Date(emp.deactivationApprovedAt).toLocaleDateString('en-GB') : '',
          terminationReason: emp.terminationReason || '',
          terminatedAt: emp.terminatedAt ? new Date(emp.terminatedAt).toLocaleDateString('en-GB') : '',
          
          // Employee Key for public URL
          employeeKey: emp.employeeKey || ''
        };
      })
    );

    res.status(200).json({
      success: true,
      employees: enrichedEmployees,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// @desc    Get employee by ID
// @route   GET /api/admin/employees/:id
// @access  Private (super_admin only)
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Onboarding.findById(req.params.id)
      .populate('outlet', 'name code')
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get field coach info
    let fieldCoachName = '';
    if (employee.outlet) {
      const outlet = await Outlet.findById(employee.outlet._id).populate('fieldCoach', 'name');
      fieldCoachName = outlet?.fieldCoach?.name || '';
    }

    const enrichedEmployee = {
      id: employee._id,
      name: employee.fullName,
      phone: employee.phone,
      email: employee.email,
      aadhaarNumber: employee.aadhaarNumber ? `XXXX-XXXX-${employee.aadhaarNumber.slice(-4)}` : '',
      panNumber: employee.panNumber || '',
      designation: employee.role || 'N/A',
      role: employee.role || 'N/A',
      store: employee.outlet?.name || 'N/A',
      storeCode: employee.outlet?.code || 'N/A',
      storeName: employee.outlet?.name || 'N/A',
      fieldCoach: fieldCoachName,
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-GB') : (employee.approvalDate ? new Date(employee.approvalDate).toLocaleDateString('en-GB') : new Date(employee.createdAt).toLocaleDateString('en-GB')),
      status: employee.status === 'submitted' || employee.status === 'pending_approval' ? 'pending' : employee.status,
      employeeStatus: employee.employeeStatus || 'active',
      aadhaarVerified: employee.aadhaarVerified || false,
      panVerified: employee.panVerified || false,
      createdAt: new Date(employee.createdAt).toLocaleDateString('en-GB'),
      
      // Personal Information
      gender: employee.gender || '',
      dateOfBirth: employee.dob ? new Date(employee.dob).toLocaleDateString('en-GB') : '',
      maritalStatus: employee.maritalStatus || '',
      bloodGroup: employee.bloodGroup || '',
      
      // Contact Information
      phone2: employee.phone2 || '',
      phoneOtpVerified: employee.phoneOtpVerified || false,
      emailOtpVerified: employee.emailOtpVerified || false,
      currentAddress: employee.currentAddress || '',
      permanentAddress: employee.permanentAddress || '',
      
      // Education
      qualification: employee.qualification || '',
      specialization: employee.specialization || '',
      educationStatus: employee.educationStatus || '',
      
      // Work Experience
      totalExperience: employee.totalExperience || '',
      lastDesignation: employee.lastDesignation || '',
      
      // Employment Details
      department: employee.department || '',
      
      // Uniform & Vaccination
      tshirtSize: employee.tshirtSize || '',
      lowerSize: employee.lowerSize || '',
      covidVaccinated: employee.covidVaccinated || false,
      hepatitisVaccinated: employee.hepatitisVaccinated || false,
      typhoidVaccinated: employee.typhoidVaccinated || false,
      
      // Documents
      photo: employee.photo,
      educationCertificate: employee.educationCertificate,
      experienceDocument: employee.experienceDocument,
      idDocuments: employee.idDocuments,
      panDocument: employee.panDocument,
      certificates: employee.certificates,
      
      // Employment History
      hasEmploymentHistory: employee.previousEmployment && employee.previousEmployment.length > 0,
      previousEmployment: employee.previousEmployment || []
    };

    res.status(200).json({
      success: true,
      employee: enrichedEmployee
    });
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
      error: error.message
    });
  }
};

// @desc    Export employees to CSV
// @route   GET /api/admin/employees/export/csv
// @access  Private (super_admin only)
export const exportEmployees = async (req, res) => {
  try {
    const { search, store, status, fieldCoach, tab } = req.query;

    let query = {
      // Exclude draft and in_progress records
      status: { $nin: ['draft', 'in_progress'] }
    };

    // Apply same filters as getAllEmployees
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (store && store !== 'all') {
      query.outlet = store;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fieldCoach && fieldCoach !== 'all') {
      const outlets = await Outlet.find({ fieldCoach }).select('_id');
      query.outlet = { $in: outlets.map(o => o._id) };
    }

    if (tab) {
      if (tab === 'pending') {
        query.status = { $in: ['submitted', 'pending_approval'] };
      } else if (tab === 'active') {
        query.status = 'approved';
        query.employeeStatus = { $in: ['active', null] };
      } else if (tab === 'terminated') {
        query.employeeStatus = 'terminated';
        query.status = { $nin: ['draft', 'in_progress'] };
      } else if (tab === 'long-pending') {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        query.status = { $in: ['submitted', 'pending_approval'] };
        query.createdAt = { $lt: fiveDaysAgo };
      } else if (tab === 'missing-docs') {
        query.status = { $nin: ['draft', 'in_progress'] };
        query.$or = [
          { aadhaarVerified: false },
          { photo: { $exists: false } }
        ];
      } else if (tab === 'rehire') {
        query.employeeStatus = 'deactivated';
        query.status = { $nin: ['draft', 'in_progress'] };
      }
    }

    const employees = await Onboarding.find(query)
      .populate('outlet', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV content
    const csvRows = [
      'Name,Phone,Email,Aadhaar,PAN,Designation,Store,Store Code,Status,Date of Joining,Created At'
    ];

    for (const emp of employees) {
      const row = [
        emp.fullName || '',
        emp.phone || '',
        emp.email || '',
        emp.aadhaarNumber ? `XXXX-XXXX-${emp.aadhaarNumber.slice(-4)}` : '',
        emp.panNumber || '',
        emp.role || 'N/A',
        emp.outlet?.name || 'N/A',
        emp.outlet?.code || 'N/A',
        emp.status || '',
        emp.approvalDate ? new Date(emp.approvalDate).toISOString().split('T')[0] : '',
        new Date(emp.createdAt).toISOString().split('T')[0]
      ].map(field => `"${field}"`).join(',');
      
      csvRows.push(row);
    }

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=employees_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export employees',
      error: error.message
    });
  }
};

// @desc    Export employees to JSON
// @route   GET /api/admin/employees/export/json
// @access  Private (super_admin only)
export const exportEmployeesJSON = async (req, res) => {
  try {
    const { search, store, status, fieldCoach, tab } = req.query;

    let query = {
      // Exclude draft and in_progress records
      status: { $nin: ['draft', 'in_progress'] }
    };

    // Apply same filters as getAllEmployees
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (store && store !== 'all') {
      query.outlet = store;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fieldCoach && fieldCoach !== 'all') {
      const outlets = await Outlet.find({ fieldCoach }).select('_id');
      query.outlet = { $in: outlets.map(o => o._id) };
    }

    if (tab) {
      if (tab === 'pending') {
        query.status = { $in: ['submitted', 'pending_approval'] };
      } else if (tab === 'active') {
        query.status = 'approved';
        query.employeeStatus = { $in: ['active', null] };
      } else if (tab === 'terminated') {
        query.employeeStatus = 'terminated';
        query.status = { $nin: ['draft', 'in_progress'] };
      } else if (tab === 'long-pending') {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        query.status = { $in: ['submitted', 'pending_approval'] };
        query.createdAt = { $lt: fiveDaysAgo };
      } else if (tab === 'missing-docs') {
        query.status = { $nin: ['draft', 'in_progress'] };
        query.$or = [
          { aadhaarVerified: false },
          { photo: { $exists: false } }
        ];
      } else if (tab === 'rehire') {
        query.employeeStatus = 'deactivated';
        query.status = { $nin: ['draft', 'in_progress'] };
      }
    }

    const employees = await Onboarding.find(query)
      .populate('outlet', 'code')
      .sort({ createdAt: -1 })
      .lean();

    // Format the data according to the required structure
    const formattedEmployees = employees.map(emp => ({
      employee: {
        employeeKey: emp.employeeKey || null,
        username: emp.fullName || '',
        fullName: emp.fullName || '',
        countryCode: '+91',
        phone: emp.phone || '',
        email: emp.email || '',
        designation: emp.role || emp.designation || '',
        outlet: emp.outlet?.code || '',
        dateOfJoining: emp.approvalDate ? new Date(emp.approvalDate).toISOString().split('T')[0] : '',
        employeeStatus: emp.employeeStatus || 'active',
        gender: emp.gender || '',
        dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : ''
      }
    }));

    // Send as downloadable JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=employees_${new Date().toISOString().split('T')[0]}.json`);
    res.status(200).json({
      success: true,
      exportDate: new Date().toISOString(),
      totalRecords: formattedEmployees.length,
      employees: formattedEmployees
    });
  } catch (error) {
    console.error('Export employees JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export employees',
      error: error.message
    });
  }
};

// @desc    Get field coaches list
// @route   GET /api/admin/field-coaches
// @access  Private (super_admin only)
export const getFieldCoaches = async (req, res) => {
  try {
    const coaches = await User.find({ role: 'field_coach' })
      .select('name email phone assignedStores isActive')
      .lean();

    res.status(200).json({
      success: true,
      coaches: coaches.map(c => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone,
        assignedOutlets: c.assignedStores || [],
        isActive: c.isActive !== false
      }))
    });
  } catch (error) {
    console.error('Get field coaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field coaches',
      error: error.message
    });
  }
};

// @desc    Get store managers list
// @route   GET /api/admin/users/store-managers
// @access  Private (super_admin only)
export const getStoreManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'store_manager' })
      .select('name email phone storeCode storeName isActive')
      .lean();

    // Get outlet info for each manager
    const managersWithOutlets = await Promise.all(
      managers.map(async (m) => {
        let outletInfo = {};
        if (m.storeCode) {
          const outlet = await Outlet.findOne({ code: m.storeCode }).select('_id name code');
          if (outlet) {
            outletInfo = {
              outletId: outlet._id.toString(),
              storeName: outlet.name,
              storeCode: outlet.code
            };
          }
        }
        
        return {
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          phone: m.phone,
          ...outletInfo,
          isActive: m.isActive !== false
        };
      })
    );

    res.status(200).json({
      success: true,
      managers: managersWithOutlets
    });
  } catch (error) {
    console.error('Get store managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store managers',
      error: error.message
    });
  }
};

// @desc    Create field coach
// @route   POST /api/admin/users/field-coach
// @access  Private (super_admin only)
export const createFieldCoach = async (req, res) => {
  try {
    const { name, email, phone, password, assignedOutlets } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create field coach
    const coach = await User.create({
      name,
      email,
      phone,
      password,
      role: 'field_coach',
      assignedStores: assignedOutlets || []
    });

    // Update outlets with this field coach
    if (assignedOutlets && assignedOutlets.length > 0) {
      await Outlet.updateMany(
        { _id: { $in: assignedOutlets } },
        { $set: { fieldCoach: coach._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Field coach created successfully',
      user: {
        id: coach._id,
        name: coach.name,
        email: coach.email
      }
    });
  } catch (error) {
    console.error('Create field coach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create field coach',
      error: error.message
    });
  }
};

// @desc    Create store manager
// @route   POST /api/admin/users/store-manager
// @access  Private (super_admin only)
export const createStoreManager = async (req, res) => {
  try {
    const { name, email, phone, password, outlet } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Get outlet info
    const outletDoc = await Outlet.findById(outlet);
    if (!outletDoc) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Create store manager
    const manager = await User.create({
      name,
      email,
      phone,
      password,
      role: 'store_manager',
      storeCode: outletDoc.code,
      storeName: outletDoc.name
    });

    // Update outlet with manager
    outletDoc.manager = manager._id;
    await outletDoc.save();

    res.status(201).json({
      success: true,
      message: 'Store manager created successfully',
      user: {
        id: manager._id,
        name: manager.name,
        email: manager.email
      }
    });
  } catch (error) {
    console.error('Create store manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create store manager',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (super_admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, assignedOutlets, outlet } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    // Update field coach assignments
    if (user.role === 'field_coach' && assignedOutlets) {
      // Remove old assignments
      await Outlet.updateMany(
        { fieldCoach: user._id },
        { $unset: { fieldCoach: 1 } }
      );
      
      // Add new assignments
      user.assignedStores = assignedOutlets;
      await Outlet.updateMany(
        { _id: { $in: assignedOutlets } },
        { $set: { fieldCoach: user._id } }
      );
    }

    // Update store manager outlet
    if (user.role === 'store_manager' && outlet) {
      const outletDoc = await Outlet.findById(outlet);
      if (outletDoc) {
        user.storeCode = outletDoc.code;
        user.storeName = outletDoc.name;
        outletDoc.manager = user._id;
        await outletDoc.save();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (super_admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from outlet assignments
    if (user.role === 'field_coach') {
      await Outlet.updateMany(
        { fieldCoach: user._id },
        { $unset: { fieldCoach: 1 } }
      );
    } else if (user.role === 'store_manager') {
      await Outlet.updateMany(
        { manager: user._id },
        { $unset: { manager: 1 } }
      );
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// @desc    Terminate an employee
// @route   POST /api/admin/employees/:id/terminate
// @access  Private (super_admin only)
export const terminateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Termination reason is required'
      });
    }

    // Find the employee's onboarding record
    const employee = await Onboarding.findById(id).populate('outlet', 'name code');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status !== 'approved' || employee.employeeStatus === 'terminated') {
      return res.status(400).json({
        success: false,
        message: 'Only active approved employees can be terminated'
      });
    }

    // Add to employment history before terminating
    const employmentHistory = {
      role: employee.role,
      outlet: {
        name: employee.outlet?.name || '',
        code: employee.outlet?.code || ''
      },
      joinDate: employee.approvedAt || employee.dateOfJoining,
      endDate: new Date(),
      endReason: 'terminated',
      terminationReason: reason,
      performanceNotes: ''
    };

    employee.previousEmployment = employee.previousEmployment || [];
    employee.previousEmployment.push(employmentHistory);

    // Update employee status
    employee.status = 'terminated';
    employee.employeeStatus = 'terminated';
    employee.terminationReason = reason;
    employee.terminatedBy = req.user._id;
    employee.terminatedAt = new Date();

    await employee.save();

    console.log(`✅ Employee ${employee.fullName} terminated by ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: 'Employee terminated successfully',
      employee: {
        id: employee._id,
        name: employee.fullName,
        terminatedAt: employee.terminatedAt,
        reason: employee.terminationReason
      }
    });
  } catch (error) {
    console.error('Terminate employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate employee',
      error: error.message
    });
  }
};

// @desc    Get all deactivation requests
// @route   GET /api/admin/deactivations
// @access  Private (super_admin only)
export const getDeactivationRequests = async (req, res) => {
  try {
    // Find all deactivation pending employees
    const deactivationRequests = await Onboarding.find({
      status: 'approved',
      employeeStatus: 'deactivation_pending'
    })
      .populate('outlet', 'name code')
      .populate('deactivationRequestedBy', 'name email')
      .sort({ deactivationRequestedAt: -1 })
      .lean();

    // Get field coach info for each request
    const enrichedRequests = await Promise.all(
      deactivationRequests.map(async (req) => {
        let fieldCoachName = '';
        if (req.outlet) {
          const outlet = await Outlet.findById(req.outlet._id).populate('fieldCoach', 'name');
          fieldCoachName = outlet?.fieldCoach?.name || '';
        }

        return {
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
          fieldCoach: fieldCoachName,
          dateOfJoining: req.dateOfJoining ? new Date(req.dateOfJoining).toLocaleDateString('en-GB') : (req.approvalDate ? new Date(req.approvalDate).toLocaleDateString('en-GB') : 'N/A'),
          requestedAt: req.deactivationRequestedAt ? new Date(req.deactivationRequestedAt).toLocaleDateString('en-GB') : 'N/A',
          requestedBy: req.deactivationRequestedBy?.name || 'Store Manager',
          reason: req.deactivationReason || 'No reason provided',
          status: 'pending' // Set to 'pending' for frontend compatibility
        };
      })
    );

    res.status(200).json({
      success: true,
      deactivations: enrichedRequests,
      total: enrichedRequests.length
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

// @desc    Deactivate employee directly (admin only)
// @route   POST /api/admin/employees/:id/deactivate
// @access  Private (super_admin only)
export const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Deactivation reason is required'
      });
    }

    // Find the employee
    const employee = await Onboarding.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved employees can be deactivated'
      });
    }

    if (employee.employeeStatus === 'deactivated') {
      return res.status(400).json({
        success: false,
        message: 'Employee is already deactivated'
      });
    }

    // Update employee status to deactivated
    employee.employeeStatus = 'deactivated';
    employee.deactivationReason = reason;
    employee.deactivationApprovedBy = req.user._id;
    employee.deactivationApprovedAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: `${employee.fullName} has been deactivated successfully`,
      data: {
        id: employee._id,
        name: employee.fullName,
        employeeStatus: employee.employeeStatus,
        deactivatedAt: employee.deactivationApprovedAt
      }
    });
  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};

// @desc    Rehire a deactivated employee
// @route   POST /api/admin/employees/:id/rehire
// @access  Private (super_admin only)
export const rehireEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Onboarding.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.employeeStatus !== 'deactivated') {
      return res.status(400).json({
        success: false,
        message: 'Only deactivated employees can be rehired'
      });
    }

    // Move current employment to history
    if (employee.outlet && employee.role) {
      const employmentRecord = {
        role: employee.role,
        outlet: {
          name: employee.outlet?.name || 'N/A',
          code: employee.outlet?.code || 'N/A'
        },
        joinDate: employee.approvalDate || employee.createdAt,
        endDate: employee.deactivationApprovedAt || new Date(),
        endReason: 'deactivated',
        terminationReason: employee.deactivationReason || ''
      };
      
      if (!employee.previousEmployment) {
        employee.previousEmployment = [];
      }
      employee.previousEmployment.push(employmentRecord);
    }

    // Reactivate the employee
    employee.employeeStatus = 'active';
    employee.status = 'approved';
    
    // Clear deactivation fields (optional - keep for history)
    // employee.deactivationReason = undefined;
    // employee.deactivationApprovedBy = undefined;
    // employee.deactivationApprovedAt = undefined;

    await employee.save();

    res.json({
      success: true,
      message: `${employee.fullName} has been rehired successfully`,
      data: {
        id: employee._id,
        name: employee.fullName,
        employeeStatus: employee.employeeStatus,
        status: employee.status
      }
    });
  } catch (error) {
    console.error('Rehire employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};

// @desc    Generate shareable export link
// @route   POST /api/admin/generate-export-link
// @access  Private (super_admin only)
export const generateExportLink = async (req, res) => {
  try {
    const { search, store, status, fieldCoach, tab } = req.query;
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token with filters and expiry (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    exportTokens.set(token, {
      filters: { search, store, status, fieldCoach, tab },
      expiresAt,
      createdBy: req.user.id
    });

    // Generate the public link
    // const baseUrl = process.env.API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';
    const baseUrl = process.env.API_URL || 'https://burgersingfrontbackend.kamaaupoot.in/api';
    const link = `${baseUrl}/public/export-employees/${token}`;

    res.status(200).json({
      success: true,
      token,
      link,
      expiresAt: expiresAt.toISOString(),
      message: 'Export link generated successfully'
    });
  } catch (error) {
    console.error('Generate export link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate export link',
      error: error.message
    });
  }
};

// @desc    Public endpoint to export employees using token
// @route   GET /api/public/export-employees/:token
// @access  Public (with valid token)
export const publicExportEmployees = async (req, res) => {
  try {
    const { token } = req.params;

    // Check if token exists
    const tokenData = exportTokens.get(token);
    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired export link'
      });
    }

    // Check if token has expired
    if (new Date() > tokenData.expiresAt) {
      exportTokens.delete(token);
      return res.status(410).json({
        success: false,
        message: 'Export link has expired'
      });
    }

    // Get filters from token
    const { filters } = tokenData;
    const { search, store, status, fieldCoach, tab } = filters;

    // Build query with filters
    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } },
        { employeeKey: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (store && store !== 'all') {
      const outlet = await Outlet.findOne({ code: store });
      if (outlet) {
        query.outlet = outlet._id;
      }
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (fieldCoach && fieldCoach !== 'all') {
      const outlets = await Outlet.find({ fieldCoach }).select('_id');
      const outletIds = outlets.map(o => o._id);
      query.outlet = { $in: outletIds };
    }
    
    if (tab && tab !== 'all') {
      switch(tab) {
        case 'pending':
          query.status = { $in: ['submitted', 'pending_approval'] };
          break;
        case 'approved':
          query.status = { $in: ['approved', 'active'] };
          break;
        case 'rejected':
          query.status = 'rejected';
          break;
        case 'terminated':
          query.employeeStatus = { $in: ['deactivated', 'terminated'] };
          break;
      }
    }

    // Fetch employees
    const employees = await Onboarding.find(query)
      .populate('outlet', 'code name city')
      .select('fullName dob gender phone email designation dateOfJoining employeeStatus employeeKey outlet role countryCode')
      .sort({ createdAt: -1 })
      .lean();

    // Format employees data according to specification
    const formattedEmployees = employees.map(emp => ({
      employee: {
        employeeKey: emp.employeeKey || '',
        username: emp.fullName || '',
        fullName: emp.fullName || '',
        countryCode: emp.countryCode || '+91',
        phone: emp.phone || '',
        email: emp.email || '',
        designation: emp.designation || emp.role || '',
        outlet: emp.outlet?.code || '',
        outletName: emp.outlet?.name || '',
        city: emp.outlet?.city || '',
        dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
        employeeStatus: emp.employeeStatus || '',
        gender: emp.gender || '',
        dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : ''
      }
    }));

    res.status(200).json({
      success: true,
      exportDate: new Date().toISOString(),
      totalRecords: formattedEmployees.length,
      employees: formattedEmployees
    });
  } catch (error) {
    console.error('Public export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export employees',
      error: error.message
    });
  }
};


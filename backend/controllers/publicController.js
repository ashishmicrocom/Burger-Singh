import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';

// @desc    Get employee data by employee key (public access)
// @route   GET /api/public/employee/:key
// @access  Public
export const getEmployeeByKey = async (req, res) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Employee key is required'
      });
    }

    // Find employee by key
    const employee = await Onboarding.findOne({ employeeKey: key })
      .populate('outlet', 'name code city state')
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or invalid key'
      });
    }

    // Only return data for approved employees
    if (employee.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Employee data not available'
      });
    }

    // Return public employee data (limited fields)
    const publicData = {
      employeeKey: employee.employeeKey,
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email,
      role: employee.role || 'N/A',
      designation: employee.role || 'N/A',
      outlet: {
        name: employee.outlet?.name || 'N/A',
        code: employee.outlet?.code || 'N/A',
        city: employee.outlet?.city || 'N/A',
        state: employee.outlet?.state || 'N/A'
      },
      dateOfJoining: employee.approvalDate 
        ? new Date(employee.approvalDate).toLocaleDateString('en-GB') 
        : new Date(employee.createdAt).toLocaleDateString('en-GB'),
      employeeStatus: employee.employeeStatus || 'active',
      photo: employee.photo,
      
      // Personal Information (limited)
      gender: employee.gender || '',
      bloodGroup: employee.bloodGroup || '',
      
      // Work Experience
      totalExperience: employee.totalExperience || '',
      qualification: employee.qualification || '',
      
      // Uniform Size
      tshirtSize: employee.tshirtSize || '',
      lowerSize: employee.lowerSize || ''
    };

    res.status(200).json({
      success: true,
      employee: publicData
    });
  } catch (error) {
    console.error('Get employee by key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee data',
      error: error.message
    });
  }
};

import Outlet from '../models/Outlet.js';
import Onboarding from '../models/Onboarding.js';

// @desc    Get all active outlets
// @route   GET /api/outlets
// @access  Public
export const getAllOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find({ isActive: true })
      .populate('manager', 'name email')
      .populate('fieldCoach', 'name email')
      .select('code name address city state pincode phone email manager fieldCoach isActive')
      .sort({ city: 1, name: 1 })
      .lean();

    // Get employee count for each outlet
    const outletsWithCount = await Promise.all(
      outlets.map(async (outlet) => {
        const employeeCount = await Onboarding.countDocuments({ 
          outlet: outlet._id,
          status: { $in: ['approved', 'active'] }
        });
        
        return {
          id: outlet._id.toString(),
          code: outlet.code,
          name: outlet.name,
          email: outlet.email || '',
          phone: outlet.phone || '',
          address: outlet.address || '',
          city: outlet.city || '',
          state: outlet.state || '',
          pincode: outlet.pincode || '',
          fieldCoach: outlet.fieldCoach?.name || '',
          fieldCoachEmail: outlet.fieldCoach?.email || '',
          fieldCoachId: outlet.fieldCoach?._id?.toString() || '',
          manager: outlet.manager?.name || '',
          managerEmail: outlet.manager?.email || '',
          managerId: outlet.manager?._id?.toString() || '',
          employeeCount,
          status: outlet.isActive ? 'active' : 'inactive',
          createdAt: outlet.createdAt || new Date().toISOString()
        };
      })
    );

    res.status(200).json({
      success: true,
      count: outletsWithCount.length,
      outlets: outletsWithCount
    });

  } catch (error) {
    console.error('Get outlets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching outlets',
      error: error.message
    });
  }
};

// @desc    Get outlet by ID
// @route   GET /api/outlets/:id
// @access  Public
export const getOutletById = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id)
      .populate('manager', 'name email phone')
      .populate('fieldCoach', 'name email phone');

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    res.status(200).json({
      success: true,
      outlet
    });

  } catch (error) {
    console.error('Get outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching outlet'
    });
  }
};

// @desc    Create new outlet
// @route   POST /api/outlets
// @access  Private (Admin only)
export const createOutlet = async (req, res) => {
  try {
    const { code, name, address, city, state, pincode, phone, email, password, manager, fieldCoach } = req.body;

    // Validate required fields
    if (!code || !name || !address || !city || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: code, name, address, city, email, and password'
      });
    }

    // Check if outlet code already exists
    const existingOutlet = await Outlet.findOne({ code });
    if (existingOutlet) {
      return res.status(400).json({
        success: false,
        message: 'Outlet with this code already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Outlet.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Outlet with this email already exists'
      });
    }

    const outlet = await Outlet.create({
      code,
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      password,
      manager,
      fieldCoach
    });

    // Return outlet without password
    const outletData = outlet.toObject();
    delete outletData.password;

    res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      outlet: outletData
    });

  } catch (error) {
    console.error('Create outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating outlet',
      error: error.message
    });
  }
};

// @desc    Update outlet
// @route   PUT /api/outlets/:id
// @access  Private (Admin only)
export const updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'name email').populate('fieldCoach', 'name email').lean();

    // Get employee count
    const employeeCount = await Onboarding.countDocuments({ 
      outlet: updatedOutlet._id,
      status: { $in: ['approved', 'active'] }
    });

    res.status(200).json({
      success: true,
      message: 'Outlet updated successfully',
      outlet: {
        ...updatedOutlet,
        employeeCount,
        status: updatedOutlet.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Update outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating outlet'
    });
  }
};

// @desc    Toggle outlet active status
// @route   PATCH /api/outlets/:id/toggle
// @access  Private (Admin only)
export const toggleOutletStatus = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Toggle the isActive status
    outlet.isActive = !outlet.isActive;
    await outlet.save();

    res.status(200).json({
      success: true,
      message: `Outlet ${outlet.isActive ? 'activated' : 'deactivated'} successfully`,
      outlet: {
        id: outlet._id.toString(),
        code: outlet.code,
        name: outlet.name,
        isActive: outlet.isActive
      }
    });

  } catch (error) {
    console.error('Toggle outlet status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling outlet status'
    });
  }
};

// @desc    Delete outlet (soft delete)
// @route   DELETE /api/outlets/:id
// @access  Private (Admin only)
export const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }

    // Check if outlet has active employees
    const employeeCount = await Onboarding.countDocuments({ 
      outlet: outlet._id,
      status: { $in: ['approved', 'active'] }
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete outlet with ${employeeCount} active employees`
      });
    }

    outlet.isActive = false;
    await outlet.save();

    res.status(200).json({
      success: true,
      message: 'Outlet deactivated successfully'
    });

  } catch (error) {
    console.error('Delete outlet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting outlet'
    });
  }
};

// @desc    Bulk import outlets from Excel/CSV data
// @route   POST /api/outlets/bulk-import
// @access  Private (Admin only)
export const bulkImportOutlets = async (req, res) => {
  try {
    const { outlets } = req.body;

    if (!outlets || !Array.isArray(outlets) || outlets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of outlets to import'
      });
    }

    const results = {
      successCount: 0,
      failureCount: 0,
      errors: []
    };

    // Process each outlet
    for (let i = 0; i < outlets.length; i++) {
      const outletData = outlets[i];
      const rowNum = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Validate required fields
        if (!outletData.code || !outletData.name || !outletData.email || !outletData.password || !outletData.address || !outletData.city) {
          results.errors.push({
            row: rowNum,
            code: outletData.code || 'N/A',
            error: 'Missing required fields (code, name, email, password, address, city)'
          });
          results.failureCount++;
          continue;
        }

        // Check if outlet code already exists
        const existingCode = await Outlet.findOne({ code: outletData.code });
        if (existingCode) {
          results.errors.push({
            row: rowNum,
            code: outletData.code,
            error: 'Outlet with this code already exists'
          });
          results.failureCount++;
          continue;
        }

        // Check if email already exists
        const existingEmail = await Outlet.findOne({ email: outletData.email });
        if (existingEmail) {
          results.errors.push({
            row: rowNum,
            code: outletData.code,
            error: 'Outlet with this email already exists'
          });
          results.failureCount++;
          continue;
        }

        // Create the outlet
        await Outlet.create({
          code: outletData.code.trim(),
          name: outletData.name.trim(),
          email: outletData.email.trim().toLowerCase(),
          password: outletData.password,
          address: outletData.address.trim(),
          city: outletData.city.trim(),
          state: outletData.state ? outletData.state.trim() : undefined,
          pincode: outletData.pincode ? outletData.pincode.toString().trim() : undefined,
          phone: outletData.phone ? outletData.phone.toString().trim() : undefined,
          manager: undefined,
          fieldCoach: undefined
        });

        results.successCount++;
      } catch (error) {
        results.errors.push({
          row: rowNum,
          code: outletData.code || 'N/A',
          error: error.message || 'Failed to create outlet'
        });
        results.failureCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.successCount} succeeded, ${results.failureCount} failed`,
      successCount: results.successCount,
      failureCount: results.failureCount,
      errors: results.errors
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing outlets',
      error: error.message
    });
  }
};


import Outlet from '../models/Outlet.js';
import Onboarding from '../models/Onboarding.js';
import User from '../models/User.js';

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

    // Add outlet code to field coach's assignedStores if field coach is assigned
    if (fieldCoach) {
      await User.findByIdAndUpdate(
        fieldCoach,
        { $addToSet: { assignedStores: outlet.code } },
        { new: true }
      );
    }

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

    const oldFieldCoachId = outlet.fieldCoach?.toString();
    const newFieldCoachId = req.body.fieldCoach;

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('manager', 'name email').populate('fieldCoach', 'name email').lean();

    // Handle field coach assignment changes
    if (newFieldCoachId && newFieldCoachId !== oldFieldCoachId) {
      // Remove outlet from old field coach's assignedStores
      if (oldFieldCoachId) {
        await User.findByIdAndUpdate(
          oldFieldCoachId,
          { $pull: { assignedStores: outlet.code } }
        );
      }
      // Add outlet to new field coach's assignedStores
      await User.findByIdAndUpdate(
        newFieldCoachId,
        { $addToSet: { assignedStores: outlet.code } }
      );
    } else if (!newFieldCoachId && oldFieldCoachId && req.body.hasOwnProperty('fieldCoach')) {
      // Field coach was removed
      await User.findByIdAndUpdate(
        oldFieldCoachId,
        { $pull: { assignedStores: outlet.code } }
      );
    }

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

// @desc    Delete outlet (PERMANENT DELETE - NOT SOFT DELETE)
// @route   DELETE /api/outlets/:id
// @access  Private (Admin only)
export const deleteOutlet = async (req, res) => {
  try {
    console.log('=== PERMANENT DELETE OUTLET ===');
    console.log('Outlet ID to delete:', req.params.id);

    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found in database'
      });
    }

    console.log('Found outlet to delete:', outlet.name, outlet.code);

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

    // PERMANENTLY DELETE from MongoDB
    const deleteResult = await Outlet.deleteOne({ _id: req.params.id });
    
    console.log('Delete result:', deleteResult);

    if (deleteResult.deletedCount === 1) {
      console.log('OUTLET PERMANENTLY DELETED FROM DATABASE');
      return res.status(200).json({
        success: true,
        message: 'Outlet permanently deleted from database'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete outlet'
      });
    }

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
        // Normalize column names (handle both camelCase and space-separated formats)
        const normalizedData = {
          code: outletData.code || outletData.Code,
          name: outletData.name || outletData.Name,
          email: outletData.email || outletData.Email,
          password: outletData.password || outletData.Password,
          phone: outletData.phone || outletData.Phone,
          address: outletData.address || outletData.Address,
          city: outletData.city || outletData.City,
          state: outletData.state || outletData.State,
          pincode: outletData.pincode || outletData.Pincode,
          fieldCoach: outletData.fieldCoach || outletData['Field Coach'],
          fieldCoachEmail: outletData.fieldCoachEmail || outletData['Field Coach Email'],
          fieldCoachPhone: outletData.fieldCoachPhone || outletData['Field Coach Phone'],
          fieldCoachPassword: outletData.fieldCoachPassword || outletData['Field Coach Password']
        };

        // Validate required fields
        if (!normalizedData.code || !normalizedData.name || !normalizedData.email || !normalizedData.password || !normalizedData.address || !normalizedData.city) {
          results.errors.push({
            row: rowNum,
            code: normalizedData.code || 'N/A',
            error: 'Missing required fields (code, name, email, password, address, city)'
          });
          results.failureCount++;
          continue;
        }

        // Validate Field Coach and Field Coach Email are required
        if (!normalizedData.fieldCoach || !normalizedData.fieldCoachEmail) {
          results.errors.push({
            row: rowNum,
            code: normalizedData.code || 'N/A',
            error: 'Missing required fields (fieldCoach/Field Coach, fieldCoachEmail/Field Coach Email)'
          });
          results.failureCount++;
          continue;
        }

        // Use normalized data for the rest of the processing
        const outletDataNormalized = normalizedData;

        // Look up field coach by email or create if password provided
        let fieldCoachId = undefined;
        if (outletDataNormalized.fieldCoachEmail) {
          let fieldCoachUser = await User.findOne({ 
            email: outletDataNormalized.fieldCoachEmail.trim().toLowerCase(),
            role: 'field_coach'
          });
          
          if (!fieldCoachUser) {
            // Use outlet's password and phone as fallback for field coach
            const coachPassword = outletDataNormalized.fieldCoachPassword || outletDataNormalized.password;
            const coachPhone = outletDataNormalized.fieldCoachPhone || outletDataNormalized.phone;
            
            // If field coach doesn't exist and password is provided, create them
            if (coachPassword) {
              try {
                fieldCoachUser = await User.create({
                  name: outletDataNormalized.fieldCoach ? outletDataNormalized.fieldCoach.trim() : 'Field Coach',
                  email: outletDataNormalized.fieldCoachEmail.trim().toLowerCase(),
                  password: coachPassword,
                  role: 'field_coach',
                  phone: coachPhone ? coachPhone.toString().trim() : undefined,
                  isActive: true
                });
              } catch (createError) {
                results.errors.push({
                  row: rowNum,
                  code: outletDataNormalized.code,
                  error: `Failed to create Field Coach: ${createError.message}`
                });
                results.failureCount++;
                continue;
              }
            } else {
              results.errors.push({
                row: rowNum,
                code: outletDataNormalized.code,
                error: `Field Coach with email '${outletDataNormalized.fieldCoachEmail}' not found. Provide fieldCoachPassword or outlet password to create a new field coach.`
              });
              results.failureCount++;
              continue;
            }
          } else {
            // Update phone if provided for existing field coach (prefer fieldCoachPhone, fallback to outlet phone)
            const phoneToUpdate = outletDataNormalized.fieldCoachPhone || outletDataNormalized.phone;
            if (phoneToUpdate && !fieldCoachUser.phone) {
              fieldCoachUser.phone = phoneToUpdate.toString().trim();
              await fieldCoachUser.save();
            }
          }
          fieldCoachId = fieldCoachUser._id;
        }

        // Check if outlet code already exists
        const existingOutlet = await Outlet.findOne({ code: outletDataNormalized.code });
        
        if (existingOutlet) {
          // Update existing outlet
          const oldFieldCoachId = existingOutlet.fieldCoach?.toString();
          
          // Update the outlet with new data
          existingOutlet.name = outletDataNormalized.name.trim();
          existingOutlet.address = outletDataNormalized.address.trim();
          existingOutlet.city = outletDataNormalized.city.trim();
          if (outletDataNormalized.state) existingOutlet.state = outletDataNormalized.state.trim();
          if (outletDataNormalized.pincode) existingOutlet.pincode = outletDataNormalized.pincode.toString().trim();
          if (outletDataNormalized.phone) existingOutlet.phone = outletDataNormalized.phone.toString().trim();
          
          // Update field coach if changed
          if (fieldCoachId && fieldCoachId.toString() !== oldFieldCoachId) {
            existingOutlet.fieldCoach = fieldCoachId;
            
            // Remove outlet from old field coach's assignedStores
            if (oldFieldCoachId) {
              await User.findByIdAndUpdate(
                oldFieldCoachId,
                { $pull: { assignedStores: existingOutlet.code } },
                { new: true }
              );
            }
            
            // Add outlet to new field coach's assignedStores
            await User.findByIdAndUpdate(
              fieldCoachId,
              { $addToSet: { assignedStores: existingOutlet.code } },
              { new: true }
            );
          }
          
          await existingOutlet.save();
          results.successCount++;
          continue;
        }

        // Check if email already exists (only for new outlets)
        const existingEmail = await Outlet.findOne({ email: outletDataNormalized.email });
        if (existingEmail) {
          results.errors.push({
            row: rowNum,
            code: outletDataNormalized.code,
            error: 'Outlet with this email already exists'
          });
          results.failureCount++;
          continue;
        }

        // Create the outlet
        const newOutlet = await Outlet.create({
          code: outletDataNormalized.code.trim(),
          name: outletDataNormalized.name.trim(),
          email: outletDataNormalized.email.trim().toLowerCase(),
          password: outletDataNormalized.password,
          address: outletDataNormalized.address.trim(),
          city: outletDataNormalized.city.trim(),
          state: outletDataNormalized.state ? outletDataNormalized.state.trim() : undefined,
          pincode: outletDataNormalized.pincode ? outletDataNormalized.pincode.toString().trim() : undefined,
          phone: outletDataNormalized.phone ? outletDataNormalized.phone.toString().trim() : undefined,
          manager: undefined,
          fieldCoach: fieldCoachId
        });

        // Add outlet code to field coach's assignedStores if not already present
        if (fieldCoachId) {
          await User.findByIdAndUpdate(
            fieldCoachId,
            { $addToSet: { assignedStores: newOutlet.code } },
            { new: true }
          );
        }

        results.successCount++;
      } catch (error) {
        results.errors.push({
          row: rowNum,
          code: outletData.code || normalizedData?.code || 'N/A',
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


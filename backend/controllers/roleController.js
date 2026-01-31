import Role from '../models/Role.js';
import Onboarding from '../models/Onboarding.js';

// @desc    Get all active roles
// @route   GET /api/roles
// @access  Public
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .select('id title description category')
      .sort({ category: 1, title: 1 })
      .lean();

    // Get user count for each role
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await Onboarding.countDocuments({ 
          role: role._id,
          status: { $in: ['approved', 'active'] }
        });
        
        return {
          ...role,
          name: role.title,
          userCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: rolesWithCount.length,
      roles: rolesWithCount
    });

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching roles'
    });
  }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Public
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({ id: req.params.id });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      role
    });

  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching role'
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (Admin only)
export const createRole = async (req, res) => {
  try {
    const { id, title, description, category } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ id });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this ID already exists'
      });
    }

    const role = await Role.create({
      id,
      title,
      description,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role
    });

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating role',
      error: error.message
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (Admin only)
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findOne({ id: req.params.id });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const updatedRole = await Role.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      role: updatedRole
    });

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role'
    });
  }
};

// @desc    Delete role (soft delete)
// @route   DELETE /api/roles/:id
// @access  Private (Admin only)
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ id: req.params.id });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role has active users
    const userCount = await Onboarding.countDocuments({ 
      role: role._id,
      status: { $in: ['approved', 'active'] }
    });

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role with ${userCount} active users`
      });
    }

    // Permanently delete the role from database
    await Role.deleteOne({ _id: role._id });

    res.status(200).json({
      success: true,
      message: 'Role permanently deleted from database'
    });

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting role'
    });
  }
};

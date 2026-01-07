import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

// Generate JWT Token for User
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Generate JWT Token for Outlet
const generateOutletToken = (outletId) => {
  return jwt.sign({ outletId, isOutlet: true }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Login user or outlet
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // First try to find user
    let user = await User.findOne({ email }).select('+password');
    
    // If not found, try to find outlet
    if (!user) {
      const outlet = await Outlet.findOne({ email }).select('+password').populate('fieldCoach');
      
      if (outlet) {
        // Verify outlet password
        const isPasswordCorrect = await outlet.comparePassword(password);

        if (!isPasswordCorrect) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Check if outlet is active
        if (!outlet.isActive) {
          return res.status(403).json({
            success: false,
            message: 'This outlet has been deactivated. Please contact administrator.'
          });
        }

        // Generate outlet token
        const token = generateOutletToken(outlet._id);

        // Set cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: outlet._id,
            name: outlet.name,
            email: outlet.email,
            role: 'store_manager',
            storeName: outlet.name,
            storeCode: outlet.code,
            outletId: outlet._id,
            isOutlet: true
          },
          token
        });
      }
      
      // Neither user nor outlet found
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // User found - continue with user login
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login (use updateOne to avoid triggering password hash)
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toPublicJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Register new staff member
// @route   POST /api/auth/register
// @access  Private (Admin only)
export const register = async (req, res) => {
  try {
    const { name, email, password, role, storeCode, storeName, assignedStores, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role-specific requirements
    if (role === 'store_manager' && (!storeCode || !storeName)) {
      return res.status(400).json({
        success: false,
        message: 'Store code and name are required for store managers'
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      phone
    };

    if (role === 'store_manager') {
      userData.storeCode = storeCode;
      userData.storeName = storeName;
    }

    if (role === 'field_coach' && assignedStores) {
      userData.assignedStores = assignedStores;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // If this is an outlet login, return outlet info
    if (req.user.isOutlet) {
      return res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: 'store_manager',
          storeName: req.user.storeName,
          storeCode: req.user.storeCode,
          outletId: req.user.outletId,
          isActive: true,
          isOutlet: true
        }
      });
    }

    // Regular user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

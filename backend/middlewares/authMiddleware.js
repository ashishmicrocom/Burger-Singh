import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this is an outlet token
      if (decoded.isOutlet && decoded.outletId) {
        const outlet = await Outlet.findById(decoded.outletId).populate('fieldCoach');

        if (!outlet) {
          return res.status(401).json({
            success: false,
            message: 'Outlet not found'
          });
        }

        if (!outlet.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Outlet deactivated'
          });
        }

        // Attach outlet as user to request
        req.user = {
          _id: outlet._id,
          id: outlet._id,
          name: outlet.name,
          email: outlet.email,
          role: 'store_manager',
          storeCode: outlet.code,
          storeName: outlet.name,
          outletId: outlet._id,
          isOutlet: true
        };

        return next();
      }

      // Regular user token
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account deactivated'
        });
      }

      // Attach user to request
      req.user = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeCode: user.storeCode,
        storeName: user.storeName,
        assignedStores: user.assignedStores
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Restrict to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

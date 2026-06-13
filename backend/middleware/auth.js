const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

const protect = (allowUnverified = false) =>
  asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return next(new ErrorResponse('User not found', 401));
      }
      if (!allowUnverified && !req.user.isVerified) {
        return next(new ErrorResponse('Email verification required. Please verify your OTP.', 403));
      }
      next();
    } catch {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  });

const authorize = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized for this action', 403));
    }
    next();
  });

module.exports = { protect, authorize };

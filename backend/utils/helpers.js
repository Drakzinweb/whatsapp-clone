const mongoose = require('mongoose');

/**
 * Middleware to catch errors in async route handlers
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class for application-specific errors
 */
exports.AppError = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
};

/**
 * Standard success response
 */
exports.sendSuccess = (res, data = null, message = 'OK', statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

/**
 * Standard error response
 */
exports.sendError = (res, error, statusCode = 500) => {
  const message = error.message || 'Internal Server Error';
  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

/**
 * Parse pagination parameters from request query
 */
exports.parsePagination = (req) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
exports.isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

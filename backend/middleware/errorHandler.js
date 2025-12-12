/**
 * Error handling middleware
 * Catches unhandled errors, logs them, and returns sanitized responses
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map common error types to HTTP status codes
 */
function getStatusCode(err) {
  // If error already has a status code, use it
  if (err.statusCode) {
    return err.statusCode;
  }
  
  if (err.status) {
    return err.status;
  }

  // Map common error types
  const errorMessage = err.message.toLowerCase();
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return 404;
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid') || 
      errorMessage.includes('required')) {
    return 400;
  }
  
  // Database constraint errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return 409;
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return 400;
  }
  
  if (err.code === '23502') { // PostgreSQL not null violation
    return 400;
  }
  
  // Authentication/Authorization errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return 401;
  }
  
  if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
    return 403;
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Sanitize error message for client response
 */
function sanitizeErrorMessage(err, statusCode) {
  // For operational errors, return the actual message
  if (err.isOperational) {
    return err.message;
  }
  
  // For database errors, provide user-friendly messages
  if (err.code === '23505') {
    return 'A record with this information already exists';
  }
  
  if (err.code === '23503') {
    return 'Referenced record does not exist';
  }
  
  if (err.code === '23502') {
    return 'Required field is missing';
  }
  
  // For 4xx errors, return the message (likely validation errors)
  if (statusCode >= 400 && statusCode < 500) {
    return err.message;
  }
  
  // For 5xx errors, return generic message to avoid leaking implementation details
  return 'Internal server error';
}

/**
 * Log error details to console
 */
function logError(err, req) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Add database error code if present
  if (err.code) {
    errorLog.code = err.code;
  }
  
  // Add validation details if present
  if (err.details) {
    errorLog.details = err.details;
  }
  
  console.error('Error:', errorLog);
}

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
  // Log error details
  logError(err, req);
  
  // Determine status code
  const statusCode = getStatusCode(err);
  
  // Sanitize error message
  const message = sanitizeErrorMessage(err, statusCode);
  
  // Build error response
  const errorResponse = {
    error: message
  };
  
  // Include validation details if present
  if (err.details && statusCode === 400) {
    errorResponse.details = err.details;
  }
  
  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.originalMessage = err.message;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};

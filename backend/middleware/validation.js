/**
 * Validation middleware for contact API requests
 */

/**
 * Validates email format using a simple regex pattern
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone format - accepts various formats with digits, spaces, dashes, parentheses, and plus sign
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Middleware to validate contact data for POST and PUT requests
 * Validates required and optional fields according to business rules
 */
function validateContact(req, res, next) {
  const errors = [];
  const { firstName, lastName, email, phone, company, notes } = req.body;

  // Validate firstName (required, 1-50 chars)
  if (!firstName) {
    errors.push({
      field: 'firstName',
      message: 'First name is required'
    });
  } else if (typeof firstName !== 'string') {
    errors.push({
      field: 'firstName',
      message: 'First name must be a string'
    });
  } else if (firstName.trim().length === 0) {
    errors.push({
      field: 'firstName',
      message: 'First name cannot be empty'
    });
  } else if (firstName.length > 50) {
    errors.push({
      field: 'firstName',
      message: 'First name must not exceed 50 characters'
    });
  }

  // Validate lastName (required, 1-50 chars)
  if (!lastName) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required'
    });
  } else if (typeof lastName !== 'string') {
    errors.push({
      field: 'lastName',
      message: 'Last name must be a string'
    });
  } else if (lastName.trim().length === 0) {
    errors.push({
      field: 'lastName',
      message: 'Last name cannot be empty'
    });
  } else if (lastName.length > 50) {
    errors.push({
      field: 'lastName',
      message: 'Last name must not exceed 50 characters'
    });
  }

  // Validate email (optional, must be valid format if provided)
  if (email !== undefined && email !== null && email !== '') {
    if (typeof email !== 'string') {
      errors.push({
        field: 'email',
        message: 'Email must be a string'
      });
    } else if (!isValidEmail(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format'
      });
    }
  }

  // Validate phone (optional, must be valid format if provided)
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string') {
      errors.push({
        field: 'phone',
        message: 'Phone must be a string'
      });
    } else if (!isValidPhone(phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone format'
      });
    }
  }

  // Validate company (optional, max 100 chars)
  if (company !== undefined && company !== null && company !== '') {
    if (typeof company !== 'string') {
      errors.push({
        field: 'company',
        message: 'Company must be a string'
      });
    } else if (company.length > 100) {
      errors.push({
        field: 'company',
        message: 'Company must not exceed 100 characters'
      });
    }
  }

  // Validate notes (optional, max 500 chars)
  if (notes !== undefined && notes !== null && notes !== '') {
    if (typeof notes !== 'string') {
      errors.push({
        field: 'notes',
        message: 'Notes must be a string'
      });
    } else if (notes.length > 500) {
      errors.push({
        field: 'notes',
        message: 'Notes must not exceed 500 characters'
      });
    }
  }

  // If validation errors exist, return 400 with detailed error messages
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Validation passed, proceed to next middleware
  next();
}

/**
 * Middleware to validate ID parameter in route params
 * Ensures ID is a positive integer
 */
function validateId(req, res, next) {
  const { id } = req.params;
  
  // Check if ID is provided
  if (!id) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{
        field: 'id',
        message: 'ID parameter is required'
      }]
    });
  }

  // Parse ID as integer
  const parsedId = parseInt(id, 10);

  // Check if ID is a valid positive integer
  if (isNaN(parsedId) || parsedId <= 0 || parsedId.toString() !== id) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{
        field: 'id',
        message: 'ID must be a positive integer'
      }]
    });
  }

  // Validation passed, proceed to next middleware
  next();
}

module.exports = {
  validateContact,
  validateId,
  isValidEmail,
  isValidPhone
};

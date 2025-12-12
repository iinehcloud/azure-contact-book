const {
  validateContact,
  validateId,
  isValidEmail,
  isValidPhone
} = require('./validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('invalid @domain.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      expect(isValidPhone('+1-555-123-4567')).toBe(true);
      expect(isValidPhone('(555) 123-4567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('+44 20 1234 5678')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false); // Too short
      expect(isValidPhone('abc-def-ghij')).toBe(false); // No digits
      expect(isValidPhone('555-123')).toBe(false); // Less than 10 digits
    });
  });

  describe('validateContact', () => {
    describe('Valid contact data', () => {
      it('should pass validation with all required fields', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should pass validation with all fields provided', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-123-4567',
          company: 'Acme Corp',
          notes: 'Met at conference'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass validation with optional fields as empty strings', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          phone: '',
          company: '',
          notes: ''
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass validation with optional fields as null', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: null,
          phone: null,
          company: null,
          notes: null
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass validation with optional fields undefined', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe'
          // email, phone, company, notes are undefined
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('firstName validation', () => {
      it('should fail when firstName is missing', () => {
        // Arrange
        req.body = {
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'firstName',
            message: 'First name is required'
          }]
        });
      });

      it('should fail when firstName is not a string', () => {
        // Arrange
        req.body = {
          firstName: 123,
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'firstName',
            message: 'First name must be a string'
          }]
        });
      });

      it('should fail when firstName is empty string', () => {
        // Arrange
        req.body = {
          firstName: '   ',
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'firstName',
            message: 'First name cannot be empty'
          }]
        });
      });

      it('should fail when firstName exceeds 50 characters', () => {
        // Arrange
        req.body = {
          firstName: 'a'.repeat(51),
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'firstName',
            message: 'First name must not exceed 50 characters'
          }]
        });
      });

      it('should pass when firstName is exactly 50 characters', () => {
        // Arrange
        req.body = {
          firstName: 'a'.repeat(50),
          lastName: 'Doe'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('lastName validation', () => {
      it('should fail when lastName is missing', () => {
        // Arrange
        req.body = {
          firstName: 'John'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'lastName',
            message: 'Last name is required'
          }]
        });
      });

      it('should fail when lastName is not a string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 456
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'lastName',
            message: 'Last name must be a string'
          }]
        });
      });

      it('should fail when lastName is empty string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: '   '
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'lastName',
            message: 'Last name cannot be empty'
          }]
        });
      });

      it('should fail when lastName exceeds 50 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'b'.repeat(51)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'lastName',
            message: 'Last name must not exceed 50 characters'
          }]
        });
      });

      it('should pass when lastName is exactly 50 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'b'.repeat(50)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('email validation', () => {
      it('should fail when email has invalid format', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'email',
            message: 'Invalid email format'
          }]
        });
      });

      it('should fail when email is not a string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: 12345
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'email',
            message: 'Email must be a string'
          }]
        });
      });

      it('should pass when email is valid', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('phone validation', () => {
      it('should fail when phone has invalid format', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          phone: '123'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'phone',
            message: 'Invalid phone format'
          }]
        });
      });

      it('should fail when phone is not a string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          phone: 5551234567
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'phone',
            message: 'Phone must be a string'
          }]
        });
      });

      it('should pass when phone is valid', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-123-4567'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('company validation', () => {
      it('should fail when company exceeds 100 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          company: 'c'.repeat(101)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'company',
            message: 'Company must not exceed 100 characters'
          }]
        });
      });

      it('should fail when company is not a string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          company: 12345
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'company',
            message: 'Company must be a string'
          }]
        });
      });

      it('should pass when company is exactly 100 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          company: 'c'.repeat(100)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass when company is valid', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Corp'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('notes validation', () => {
      it('should fail when notes exceed 500 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          notes: 'n'.repeat(501)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'notes',
            message: 'Notes must not exceed 500 characters'
          }]
        });
      });

      it('should fail when notes is not a string', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          notes: 12345
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: [{
            field: 'notes',
            message: 'Notes must be a string'
          }]
        });
      });

      it('should pass when notes is exactly 500 characters', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          notes: 'n'.repeat(500)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should pass when notes is valid', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          lastName: 'Doe',
          notes: 'Met at conference'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Multiple validation errors', () => {
      it('should return all validation errors when multiple fields are invalid', () => {
        // Arrange
        req.body = {
          firstName: '   ',
          lastName: '   ',
          email: 'invalid-email',
          phone: '123'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: expect.arrayContaining([
            { field: 'firstName', message: 'First name cannot be empty' },
            { field: 'lastName', message: 'Last name cannot be empty' },
            { field: 'email', message: 'Invalid email format' },
            { field: 'phone', message: 'Invalid phone format' }
          ])
        });
      });

      it('should return multiple errors for different validation failures', () => {
        // Arrange
        req.body = {
          firstName: 'a'.repeat(51),
          lastName: 'b'.repeat(51),
          company: 'c'.repeat(101),
          notes: 'n'.repeat(501)
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        const response = res.json.mock.calls[0][0];
        expect(response.error).toBe('Validation failed');
        expect(response.details).toHaveLength(4);
      });
    });

    describe('Error message format', () => {
      it('should return error response with correct structure', () => {
        // Arrange
        req.body = {
          firstName: 'John'
          // lastName missing
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        const response = res.json.mock.calls[0][0];
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('details');
        expect(response.error).toBe('Validation failed');
        expect(Array.isArray(response.details)).toBe(true);
        expect(response.details[0]).toHaveProperty('field');
        expect(response.details[0]).toHaveProperty('message');
      });

      it('should return 400 status code for validation failures', () => {
        // Arrange
        req.body = {
          firstName: 'John',
          email: 'invalid'
        };

        // Act
        validateContact(req, res, next);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });

  describe('validateId', () => {
    it('should pass validation with valid positive integer ID', () => {
      // Arrange
      req.params.id = '1';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with large positive integer ID', () => {
      // Arrange
      req.params.id = '999999';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when ID is missing', () => {
      // Arrange
      req.params = {};

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [{
          field: 'id',
          message: 'ID parameter is required'
        }]
      });
    });

    it('should fail when ID is not a number', () => {
      // Arrange
      req.params.id = 'abc';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [{
          field: 'id',
          message: 'ID must be a positive integer'
        }]
      });
    });

    it('should fail when ID is zero', () => {
      // Arrange
      req.params.id = '0';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [{
          field: 'id',
          message: 'ID must be a positive integer'
        }]
      });
    });

    it('should fail when ID is negative', () => {
      // Arrange
      req.params.id = '-1';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [{
          field: 'id',
          message: 'ID must be a positive integer'
        }]
      });
    });

    it('should fail when ID is a decimal number', () => {
      // Arrange
      req.params.id = '1.5';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [{
          field: 'id',
          message: 'ID must be a positive integer'
        }]
      });
    });

    it('should fail when ID contains non-numeric characters', () => {
      // Arrange
      req.params.id = '1a';

      // Act
      validateId(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return error response with correct structure', () => {
      // Arrange
      req.params.id = 'invalid';

      // Act
      validateId(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('details');
      expect(response.error).toBe('Validation failed');
      expect(Array.isArray(response.details)).toBe(true);
      expect(response.details[0]).toHaveProperty('field');
      expect(response.details[0]).toHaveProperty('message');
    });
  });
});

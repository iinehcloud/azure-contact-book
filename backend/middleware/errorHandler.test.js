const { AppError, errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn(() => 'test-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('AppError', () => {
    it('should create an operational error with status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('errorHandler', () => {
    it('should handle errors with explicit status code', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error'
      });
    });

    it('should map "not found" errors to 404', () => {
      const error = new Error('Contact not found');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Contact not found'
      });
    });

    it('should map validation errors to 400', () => {
      const error = new Error('Validation failed');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed'
      });
    });

    it('should map PostgreSQL unique violation to 409', () => {
      const error = new Error('Duplicate key');
      error.code = '23505';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'A record with this information already exists'
      });
    });

    it('should map PostgreSQL foreign key violation to 400', () => {
      const error = new Error('Foreign key violation');
      error.code = '23503';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Referenced record does not exist'
      });
    });

    it('should map PostgreSQL not null violation to 400', () => {
      const error = new Error('Not null violation');
      error.code = '23502';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Required field is missing'
      });
    });

    it('should sanitize 500 errors to generic message', () => {
      const error = new Error('Database connection failed');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });

    it('should include validation details for 400 errors', () => {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.details = [
        { field: 'email', message: 'Invalid email format' }
      ];
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email format' }
        ]
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.statusCode = 400;
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          originalMessage: 'Test error'
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      error.statusCode = 400;
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test error'
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log error details to console', () => {
      const error = new Error('Test error');
      error.statusCode = 400;
      
      errorHandler(error, req, res, next);
      
      expect(console.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          message: 'Test error',
          method: 'GET',
          url: '/api/test',
          ip: '127.0.0.1',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle operational errors with original message', () => {
      const error = new AppError('Custom operational error', 400);
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Custom operational error'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for undefined routes', () => {
      notFoundHandler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Route not found',
        path: '/api/test'
      });
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle successful async operations', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);
      
      await wrappedFn(req, res, next);
      
      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

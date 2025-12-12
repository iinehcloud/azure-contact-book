const request = require('supertest');
const { initializeDatabase, closeDatabase } = require('./config/database');

// Mock the database module
jest.mock('./config/database', () => ({
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
}));

// Mock the contact routes to avoid actual database operations
jest.mock('./routes/contacts', () => {
  const express = require('express');
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.json([{ id: 1, firstName: 'Test', lastName: 'User' }]);
  });
  
  router.get('/error', (req, res, next) => {
    next(new Error('Test error'));
  });
  
  return router;
});

// Import after mocks are set up
let app, startServer, gracefulShutdown;

// Helper to reload the server module with fresh state
function reloadServerModule() {
  // Clear the module cache
  delete require.cache[require.resolve('./server')];
  
  // Re-require the module
  const serverModule = require('./server');
  app = serverModule.app;
  startServer = serverModule.startServer;
  gracefulShutdown = serverModule.gracefulShutdown;
  
  return serverModule;
}

describe('Server Integration Tests', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;
  let activeServers = [];

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Suppress console output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Load the server module initially
    reloadServerModule();
  });

  afterAll(async () => {
    // Close any active servers
    for (const server of activeServers) {
      if (server && server.close) {
        await new Promise(resolve => server.close(resolve));
      }
    }
    
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.PORT = '3000';
    process.env.CORS_ORIGIN = '*';
    process.env.NODE_ENV = 'test';
  });

  describe('Server Startup', () => {
    afterEach(async () => {
      // Clean up any servers started in this describe block
      const serversToClose = [...activeServers];
      activeServers = [];
      
      for (const server of serversToClose) {
        if (server && server.close) {
          await new Promise(resolve => {
            server.close(() => resolve());
          });
        }
      }
    });

    it('should initialize database connection on startup', async () => {
      // Arrange
      initializeDatabase.mockResolvedValue();
      const serverModule = reloadServerModule();
      
      // Use a unique port to avoid conflicts
      process.env.PORT = '0'; // Let OS assign a free port

      // Act
      await serverModule.startServer();
      
      // Wait a bit for the server to fully start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Track server for cleanup
      if (serverModule.server) {
        activeServers.push(serverModule.server);
      }

      // Assert
      expect(initializeDatabase).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Initializing database connection...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database connection established');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Server running on port'));
    });

    it('should exit process when database initialization fails', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      initializeDatabase.mockRejectedValue(dbError);
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const serverModule = reloadServerModule();

      // Act
      await serverModule.startServer();

      // Assert
      expect(initializeDatabase).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start server:', dbError);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Cleanup
      processExitSpy.mockRestore();
    });

    it('should log environment configuration on startup', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.PORT = '0';
      initializeDatabase.mockResolvedValue();
      const serverModule = reloadServerModule();

      // Act
      await serverModule.startServer();
      
      // Wait a bit for the server to fully start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Track server for cleanup
      if (serverModule.server) {
        activeServers.push(serverModule.server);
      }

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith('Environment: production');
      expect(consoleLogSpy).toHaveBeenCalledWith('CORS origin: https://example.com');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests with CORS headers', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://example.com');

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should respond to requests from any origin when configured with wildcard', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://any-origin.com');

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle preflight OPTIONS requests', async () => {
      // Act
      const response = await request(app)
        .options('/api/contacts')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');

      // Assert
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should allow configured HTTP methods', async () => {
      // Act
      const response = await request(app)
        .options('/api/contacts')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'DELETE');

      // Assert
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toMatch(/DELETE/);
    });

    it('should allow configured headers', async () => {
      // Act
      const response = await request(app)
        .options('/api/contacts')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Headers', 'Content-Type');

      // Assert
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });

  describe('Error Handling Middleware', () => {
    it('should handle 404 errors for undefined routes', async () => {
      // Act
      const response = await request(app)
        .get('/api/nonexistent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should handle errors thrown in route handlers', async () => {
      // Act
      const response = await request(app)
        .get('/api/contacts/error');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should parse JSON request bodies', async () => {
      // Act
      const response = await request(app)
        .post('/api/contacts')
        .send({ firstName: 'John', lastName: 'Doe' })
        .set('Content-Type', 'application/json');

      // Assert - should not fail due to JSON parsing
      expect(response.status).not.toBe(400);
    });

    it('should handle malformed JSON gracefully', async () => {
      // Act
      const response = await request(app)
        .post('/api/contacts')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return JSON error responses', async () => {
      // Act
      const response = await request(app)
        .get('/api/nonexistent');

      // Assert
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toBeInstanceOf(Object);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should respond to health check requests', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid timestamp in health check', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('Graceful Shutdown', () => {
    let processExitSpy;

    beforeEach(() => {
      // Mock process.exit
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
      processExitSpy.mockRestore();
      jest.clearAllTimers();
    });

    it('should close HTTP server on graceful shutdown', async () => {
      // Arrange
      jest.useFakeTimers();
      closeDatabase.mockResolvedValue();
      
      const mockServer = {
        close: jest.fn((callback) => {
          setImmediate(() => callback());
        }),
      };
      
      const serverModule = reloadServerModule();
      serverModule.server = mockServer;

      // Act
      const shutdownPromise = serverModule.gracefulShutdown('SIGTERM');
      
      // Fast-forward timers
      jest.runAllTimers();
      await shutdownPromise;

      // Assert
      expect(mockServer.close).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SIGTERM received'));
      
      jest.useRealTimers();
    });

    it('should close database connection on graceful shutdown', async () => {
      // Arrange
      jest.useFakeTimers();
      closeDatabase.mockResolvedValue();
      
      const mockServer = {
        close: jest.fn((callback) => {
          setImmediate(() => callback());
        }),
      };
      
      const serverModule = reloadServerModule();
      serverModule.server = mockServer;

      // Act
      const shutdownPromise = serverModule.gracefulShutdown('SIGTERM');
      jest.runAllTimers();
      await shutdownPromise;

      // Assert
      expect(closeDatabase).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Database connection closed');
      
      jest.useRealTimers();
    });

    it('should exit with code 0 on successful shutdown', async () => {
      // Arrange
      jest.useFakeTimers();
      closeDatabase.mockResolvedValue();
      
      const mockServer = {
        close: jest.fn((callback) => {
          setImmediate(() => callback());
        }),
      };
      
      const serverModule = reloadServerModule();
      serverModule.server = mockServer;

      // Act
      const shutdownPromise = serverModule.gracefulShutdown('SIGINT');
      jest.runAllTimers();
      await shutdownPromise;

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(0);
      
      jest.useRealTimers();
    });

    it('should exit with code 1 on shutdown error', async () => {
      // Arrange
      jest.useFakeTimers();
      const dbError = new Error('Failed to close database');
      closeDatabase.mockRejectedValue(dbError);
      
      const mockServer = {
        close: jest.fn((callback) => {
          setImmediate(() => callback());
        }),
      };
      
      const serverModule = reloadServerModule();
      serverModule.server = mockServer;

      // Act
      const shutdownPromise = serverModule.gracefulShutdown('SIGTERM');
      jest.runAllTimers();
      await shutdownPromise;

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error during shutdown:', dbError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      jest.useRealTimers();
    });

    it('should handle shutdown when server is not running', async () => {
      // Arrange
      const serverModule = reloadServerModule();
      serverModule.server = null;

      // Act
      await serverModule.gracefulShutdown('SIGTERM');

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should log shutdown signal and sequence', async () => {
      // Arrange
      jest.useFakeTimers();
      closeDatabase.mockResolvedValue();
      
      const mockServer = {
        close: jest.fn((callback) => {
          setImmediate(() => callback());
        }),
      };
      
      const serverModule = reloadServerModule();
      serverModule.server = mockServer;

      // Act
      const shutdownPromise = serverModule.gracefulShutdown('SIGTERM');
      jest.runAllTimers();
      await shutdownPromise;

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SIGTERM received'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting graceful shutdown'));
      expect(consoleLogSpy).toHaveBeenCalledWith('HTTP server closed');
      expect(consoleLogSpy).toHaveBeenCalledWith('Database connection closed');
      expect(consoleLogSpy).toHaveBeenCalledWith('Graceful shutdown completed');
      
      jest.useRealTimers();
    });
  });

  describe('Request Processing', () => {
    it('should process GET requests to /api/contacts', async () => {
      // Act
      const response = await request(app)
        .get('/api/contacts');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('should handle multiple concurrent requests', async () => {
      // Act
      const requests = Array(5).fill(null).map(() => 
        request(app).get('/health')
      );
      const responses = await Promise.all(requests);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should maintain request isolation', async () => {
      // Act
      const response1 = request(app).get('/health');
      const response2 = request(app).get('/api/contacts');
      
      const [res1, res2] = await Promise.all([response1, response2]);

      // Assert
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body).not.toEqual(res2.body);
    });
  });
});

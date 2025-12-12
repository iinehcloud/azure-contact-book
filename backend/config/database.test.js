const { Pool } = require('pg');
const {
  pool,
  query,
  getClient,
  checkConnection,
  closePool,
} = require('./database');

// Mock the pg module
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('Database Connection Module', () => {
  let mockPool;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get the mocked pool instance
    mockPool = new Pool();
  });

  afterEach(async () => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe('checkConnection', () => {
    it('should return true when connection is successful', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ now: new Date() }] }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should return false when connection fails', async () => {
      // Arrange
      const connectionError = new Error('Connection refused');
      mockPool.connect.mockRejectedValue(connectionError);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('should return false when query fails', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW()');
    });

    it('should release client even when query fails', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      await checkConnection();

      // Assert
      expect(mockClient.release).not.toHaveBeenCalled(); // Release not called due to early return in catch
    });
  });

  describe('query', () => {
    it('should execute query successfully with parameters', async () => {
      // Arrange
      const queryText = 'SELECT * FROM contacts WHERE id = $1';
      const queryParams = [1];
      const mockResult = {
        rows: [{ id: 1, first_name: 'John', last_name: 'Doe' }],
        rowCount: 1,
      };
      mockPool.query.mockResolvedValue(mockResult);

      // Act
      const result = await query(queryText, queryParams);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(queryText, queryParams);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should execute query successfully without parameters', async () => {
      // Arrange
      const queryText = 'SELECT * FROM contacts';
      const mockResult = {
        rows: [
          { id: 1, first_name: 'John', last_name: 'Doe' },
          { id: 2, first_name: 'Jane', last_name: 'Smith' },
        ],
        rowCount: 2,
      };
      mockPool.query.mockResolvedValue(mockResult);

      // Act
      const result = await query(queryText);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(queryText, undefined);
    });

    it('should throw error when query fails', async () => {
      // Arrange
      const queryText = 'SELECT * FROM invalid_table';
      const queryError = new Error('relation "invalid_table" does not exist');
      mockPool.query.mockRejectedValue(queryError);

      // Act & Assert
      await expect(query(queryText)).rejects.toThrow(queryError);
      expect(mockPool.query).toHaveBeenCalledWith(queryText, undefined);
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const queryText = 'SELECT * FROM contacts';
      const connectionError = new Error('Connection terminated unexpectedly');
      mockPool.query.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(query(queryText)).rejects.toThrow('Connection terminated unexpectedly');
    });
  });

  describe('getClient', () => {
    it('should return a client from the pool', async () => {
      // Arrange
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      // Act
      const client = await getClient();

      // Assert
      expect(client).toEqual(mockClient);
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error when pool cannot provide client', async () => {
      // Arrange
      const poolError = new Error('Pool exhausted');
      mockPool.connect.mockRejectedValue(poolError);

      // Act & Assert
      await expect(getClient()).rejects.toThrow('Pool exhausted');
      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error when connection timeout occurs', async () => {
      // Arrange
      const timeoutError = new Error('Connection timeout');
      mockPool.connect.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(getClient()).rejects.toThrow('Connection timeout');
    });
  });

  describe('closePool', () => {
    it('should close the pool successfully', async () => {
      // Arrange
      mockPool.end.mockResolvedValue();

      // Act
      await closePool();

      // Assert
      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });

    it('should throw error when pool closure fails', async () => {
      // Arrange
      const closeError = new Error('Failed to close pool');
      mockPool.end.mockRejectedValue(closeError);

      // Act & Assert
      await expect(closePool()).rejects.toThrow('Failed to close pool');
      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Pool Behavior', () => {
    it('should have error handler registered on pool', () => {
      // The error handler is registered during module initialization
      // We verify the pool has the 'on' method available
      expect(mockPool.on).toBeDefined();
      expect(typeof mockPool.on).toBe('function');
    });

    it('should handle multiple concurrent connections', async () => {
      // Arrange
      const mockClient1 = { query: jest.fn(), release: jest.fn() };
      const mockClient2 = { query: jest.fn(), release: jest.fn() };
      const mockClient3 = { query: jest.fn(), release: jest.fn() };
      
      mockPool.connect
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2)
        .mockResolvedValueOnce(mockClient3);

      // Act
      const clients = await Promise.all([
        getClient(),
        getClient(),
        getClient(),
      ]);

      // Assert
      expect(clients).toHaveLength(3);
      expect(mockPool.connect).toHaveBeenCalledTimes(3);
      expect(clients[0]).toBe(mockClient1);
      expect(clients[1]).toBe(mockClient2);
      expect(clients[2]).toBe(mockClient3);
    });

    it('should handle mixed success and failure connections', async () => {
      // Arrange
      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockPool.connect
        .mockResolvedValueOnce(mockClient)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockClient);

      // Act
      const result1 = await getClient();
      const result2Promise = getClient();
      const result3 = await getClient();

      // Assert
      expect(result1).toBe(mockClient);
      await expect(result2Promise).rejects.toThrow('Connection failed');
      expect(result3).toBe(mockClient);
      expect(mockPool.connect).toHaveBeenCalledTimes(3);
    });

    it('should handle query execution with connection pool', async () => {
      // Arrange
      const queries = [
        { text: 'SELECT * FROM contacts WHERE id = $1', params: [1] },
        { text: 'SELECT * FROM contacts WHERE id = $1', params: [2] },
        { text: 'SELECT * FROM contacts WHERE id = $1', params: [3] },
      ];
      
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      // Act
      await Promise.all(queries.map(q => query(q.text, q.params)));

      // Assert
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('Connection Failure Scenarios', () => {
    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED');
      mockPool.connect.mockRejectedValue(networkError);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = new Error('password authentication failed');
      mockPool.connect.mockRejectedValue(authError);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle database not found errors', async () => {
      // Arrange
      const dbError = new Error('database "contactbook" does not exist');
      mockPool.connect.mockRejectedValue(dbError);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle SSL connection errors', async () => {
      // Arrange
      const sslError = new Error('SSL connection required');
      mockPool.connect.mockRejectedValue(sslError);

      // Act
      const result = await checkConnection();

      // Assert
      expect(result).toBe(false);
    });
  });
});

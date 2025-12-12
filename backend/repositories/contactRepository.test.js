const contactRepository = require('./contactRepository');
const database = require('../config/database');

// Mock the database module
jest.mock('../config/database');

describe('Contact Repository', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all contacts with mapped fields', async () => {
      // Arrange
      const mockRows = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-0123',
          company: 'Acme Corp',
          notes: 'Test note',
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-02'),
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '+1-555-0124',
          company: 'Tech Inc',
          notes: null,
          created_at: new Date('2025-01-03'),
          updated_at: new Date('2025-01-04'),
        },
      ];
      database.query.mockResolvedValue({ rows: mockRows });

      // Act
      const result = await contactRepository.findAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
      expect(result[1]).toEqual({
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0124',
        company: 'Tech Inc',
        notes: null,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-04'),
      });
      expect(database.query).toHaveBeenCalledTimes(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, first_name, last_name'),
        []
      );
    });

    it('should return empty array when no contacts exist', async () => {
      // Arrange
      database.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await contactRepository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      database.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(contactRepository.findAll()).rejects.toThrow('Database connection failed');
      expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('should handle database timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      database.query.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(contactRepository.findAll()).rejects.toThrow('Query timeout');
    });
  });

  describe('findById', () => {
    it('should return contact with mapped fields when found', async () => {
      // Arrange
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.findById(1);

      // Assert
      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
    });

    it('should return null when contact not found', async () => {
      // Arrange
      database.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await contactRepository.findById(999);

      // Assert
      expect(result).toBeNull();
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [999]
      );
    });

    it('should handle null values in optional fields', async () => {
      // Arrange
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.findById(1);

      // Assert
      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database error');
      database.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(contactRepository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create contact with all fields and return mapped result', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
      };
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.create(contactData);

      // Assert
      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        notes: 'Test note',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        ['John', 'Doe', 'john@example.com', '+1-555-0123', 'Acme Corp', 'Test note']
      );
    });

    it('should create contact with only required fields', async () => {
      // Arrange
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const mockRow = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: null,
        phone: null,
        company: null,
        notes: null,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.create(contactData);

      // Assert
      expect(result).toEqual({
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: null,
        phone: null,
        company: null,
        notes: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        ['Jane', 'Smith', null, null, null, null]
      );
    });

    it('should convert empty strings to null for optional fields', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        phone: '',
        company: '',
        notes: '',
      };
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.create(contactData);

      // Assert
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contacts'),
        ['John', 'Doe', null, null, null, null]
      );
    });

    it('should throw error when database insert fails', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const dbError = new Error('Unique constraint violation');
      database.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(contactRepository.create(contactData)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle database constraint errors', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const constraintError = new Error('NOT NULL constraint failed');
      database.query.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(contactRepository.create(contactData)).rejects.toThrow('NOT NULL constraint failed');
    });
  });

  describe('update', () => {
    it('should update contact with all fields and return mapped result', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.updated@example.com',
        phone: '+1-555-9999',
        company: 'New Corp',
        notes: 'Updated note',
      };
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.updated@example.com',
        phone: '+1-555-9999',
        company: 'New Corp',
        notes: 'Updated note',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.update(1, contactData);

      // Assert
      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.updated@example.com',
        phone: '+1-555-9999',
        company: 'New Corp',
        notes: 'Updated note',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contacts'),
        ['John', 'Doe', 'john.updated@example.com', '+1-555-9999', 'New Corp', 'Updated note', 1]
      );
    });

    it('should return null when contact not found', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      database.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await contactRepository.update(999, contactData);

      // Assert
      expect(result).toBeNull();
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $7'),
        ['John', 'Doe', null, null, null, null, 999]
      );
    });

    it('should update contact with null values for optional fields', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
      };
      const mockRow = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: null,
        phone: null,
        company: null,
        notes: null,
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.update(1, contactData);

      // Assert
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.company).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should throw error when database update fails', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const dbError = new Error('Database update failed');
      database.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(contactRepository.update(1, contactData)).rejects.toThrow('Database update failed');
    });

    it('should handle constraint violations during update', async () => {
      // Arrange
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const constraintError = new Error('Check constraint violation');
      database.query.mockRejectedValue(constraintError);

      // Act & Assert
      await expect(contactRepository.update(1, contactData)).rejects.toThrow('Check constraint violation');
    });
  });

  describe('delete', () => {
    it('should delete contact and return true when found', async () => {
      // Arrange
      database.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await contactRepository.delete(1);

      // Assert
      expect(result).toBe(true);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM contacts'),
        [1]
      );
    });

    it('should return false when contact not found', async () => {
      // Arrange
      database.query.mockResolvedValue({ rowCount: 0 });

      // Act
      const result = await contactRepository.delete(999);

      // Assert
      expect(result).toBe(false);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [999]
      );
    });

    it('should throw error when database delete fails', async () => {
      // Arrange
      const dbError = new Error('Database delete failed');
      database.query.mockRejectedValue(dbError);

      // Act & Assert
      await expect(contactRepository.delete(1)).rejects.toThrow('Database delete failed');
    });

    it('should handle foreign key constraint errors', async () => {
      // Arrange
      const fkError = new Error('Foreign key constraint violation');
      database.query.mockRejectedValue(fkError);

      // Act & Assert
      await expect(contactRepository.delete(1)).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Data Mapping', () => {
    it('should correctly map snake_case database fields to camelCase', async () => {
      // Arrange
      const mockRow = {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Co',
        notes: 'Test notes',
        created_at: new Date('2025-01-01T10:00:00Z'),
        updated_at: new Date('2025-01-02T15:30:00Z'),
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.findById(1);

      // Assert
      expect(result).toHaveProperty('firstName', 'Test');
      expect(result).toHaveProperty('lastName', 'User');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('first_name');
      expect(result).not.toHaveProperty('last_name');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });

    it('should preserve data types during mapping', async () => {
      // Arrange
      const createdDate = new Date('2025-01-01T10:00:00Z');
      const updatedDate = new Date('2025-01-02T15:30:00Z');
      const mockRow = {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '123-456-7890',
        company: 'Test Co',
        notes: 'Test notes',
        created_at: createdDate,
        updated_at: updatedDate,
      };
      database.query.mockResolvedValue({ rows: [mockRow] });

      // Act
      const result = await contactRepository.findById(1);

      // Assert
      expect(typeof result.id).toBe('number');
      expect(typeof result.firstName).toBe('string');
      expect(typeof result.lastName).toBe('string');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt).toEqual(createdDate);
      expect(result.updatedAt).toEqual(updatedDate);
    });

    it('should handle all contacts with consistent mapping', async () => {
      // Arrange
      const mockRows = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: null,
          company: 'Acme',
          notes: null,
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-01'),
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: null,
          phone: '555-0123',
          company: null,
          notes: 'VIP',
          created_at: new Date('2025-01-02'),
          updated_at: new Date('2025-01-02'),
        },
      ];
      database.query.mockResolvedValue({ rows: mockRows });

      // Act
      const results = await contactRepository.findAll();

      // Assert
      results.forEach((result) => {
        expect(result).toHaveProperty('firstName');
        expect(result).toHaveProperty('lastName');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('updatedAt');
        expect(result).not.toHaveProperty('first_name');
        expect(result).not.toHaveProperty('last_name');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connection pool exhaustion', async () => {
      // Arrange
      const poolError = new Error('Connection pool exhausted');
      database.query.mockRejectedValue(poolError);

      // Act & Assert
      await expect(contactRepository.findAll()).rejects.toThrow('Connection pool exhausted');
    });

    it('should handle query syntax errors', async () => {
      // Arrange
      const syntaxError = new Error('Syntax error in SQL query');
      database.query.mockRejectedValue(syntaxError);

      // Act & Assert
      await expect(contactRepository.findAll()).rejects.toThrow('Syntax error in SQL query');
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const timeoutError = new Error('Connection timeout');
      database.query.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(contactRepository.create({ firstName: 'John', lastName: 'Doe' }))
        .rejects.toThrow('Connection timeout');
    });

    it('should handle database server errors', async () => {
      // Arrange
      const serverError = new Error('Database server unavailable');
      database.query.mockRejectedValue(serverError);

      // Act & Assert
      await expect(contactRepository.update(1, { firstName: 'John', lastName: 'Doe' }))
        .rejects.toThrow('Database server unavailable');
    });

    it('should handle transaction rollback errors', async () => {
      // Arrange
      const rollbackError = new Error('Transaction rollback');
      database.query.mockRejectedValue(rollbackError);

      // Act & Assert
      await expect(contactRepository.delete(1)).rejects.toThrow('Transaction rollback');
    });
  });
});

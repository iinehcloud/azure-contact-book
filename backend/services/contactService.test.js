const contactService = require('./contactService');
const contactRepository = require('../repositories/contactRepository');

// Mock the repository layer
jest.mock('../repositories/contactRepository');

describe('Contact Service', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all contacts from repository', async () => {
      const mockContacts = [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ];
      contactRepository.findAll.mockResolvedValue(mockContacts);

      const result = await contactService.findAll();

      expect(result).toEqual(mockContacts);
      expect(contactRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      contactRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(contactService.findAll()).rejects.toThrow('Failed to retrieve contacts');
      expect(contactRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no contacts exist', async () => {
      contactRepository.findAll.mockResolvedValue([]);

      const result = await contactService.findAll();

      expect(result).toEqual([]);
      expect(contactRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return contact when found', async () => {
      const mockContact = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      contactRepository.findById.mockResolvedValue(mockContact);

      const result = await contactService.findById(1);

      expect(result).toEqual(mockContact);
      expect(contactRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw 404 error when contact not found', async () => {
      contactRepository.findById.mockResolvedValue(null);

      try {
        await contactService.findById(999);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Contact not found');
        expect(error.statusCode).toBe(404);
      }
    });

    it('should throw error when repository fails', async () => {
      contactRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(contactService.findById(1)).rejects.toThrow('Failed to retrieve contact');
    });

    it('should preserve 404 error from repository', async () => {
      const notFoundError = new Error('Contact not found');
      notFoundError.statusCode = 404;
      contactRepository.findById.mockRejectedValue(notFoundError);

      try {
        await contactService.findById(999);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe('create', () => {
    const validContactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
      notes: 'Test notes',
    };

    it('should create contact with valid data', async () => {
      const mockCreatedContact = { id: 1, ...validContactData };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(validContactData);

      expect(result).toEqual(mockCreatedContact);
      expect(contactRepository.create).toHaveBeenCalledWith(validContactData);
    });

    it('should create contact with only required fields', async () => {
      const minimalData = { firstName: 'John', lastName: 'Doe' };
      const mockCreatedContact = { id: 1, ...minimalData };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(minimalData);

      expect(result).toEqual(mockCreatedContact);
      expect(contactRepository.create).toHaveBeenCalledWith(minimalData);
    });

    it('should throw validation error when firstName is missing', async () => {
      const invalidData = { lastName: 'Doe' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'firstName', message: 'First name is required' });
      }
    });

    it('should throw validation error when lastName is missing', async () => {
      const invalidData = { firstName: 'John' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Validation failed');
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'lastName', message: 'Last name is required' });
      }
    });

    it('should throw validation error when firstName is empty string', async () => {
      const invalidData = { firstName: '   ', lastName: 'Doe' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'firstName', message: 'First name cannot be empty' });
      }
    });

    it('should throw validation error when firstName exceeds 50 characters', async () => {
      const invalidData = { firstName: 'a'.repeat(51), lastName: 'Doe' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'firstName', message: 'First name must not exceed 50 characters' });
      }
    });

    it('should throw validation error when lastName exceeds 50 characters', async () => {
      const invalidData = { firstName: 'John', lastName: 'a'.repeat(51) };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'lastName', message: 'Last name must not exceed 50 characters' });
      }
    });

    it('should throw validation error for invalid email format', async () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', email: 'invalid-email' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'email', message: 'Invalid email format' });
      }
    });

    it('should throw validation error when email exceeds 100 characters', async () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      const invalidData = { firstName: 'John', lastName: 'Doe', email: longEmail };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'email', message: 'Email must not exceed 100 characters' });
      }
    });

    it('should throw validation error when phone exceeds 20 characters', async () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', phone: '1'.repeat(21) };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'phone', message: 'Phone must not exceed 20 characters' });
      }
    });

    it('should throw validation error when company exceeds 100 characters', async () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', company: 'a'.repeat(101) };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'company', message: 'Company must not exceed 100 characters' });
      }
    });

    it('should throw validation error when notes exceed 500 characters', async () => {
      const invalidData = { firstName: 'John', lastName: 'Doe', notes: 'a'.repeat(501) };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'notes', message: 'Notes must not exceed 500 characters' });
      }
    });

    it('should accept empty string for optional fields', async () => {
      const dataWithEmptyFields = { 
        firstName: 'John', 
        lastName: 'Doe', 
        email: '', 
        phone: '', 
        company: '', 
        notes: '' 
      };
      const mockCreatedContact = { id: 1, ...dataWithEmptyFields };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(dataWithEmptyFields);

      expect(result).toEqual(mockCreatedContact);
    });

    it('should throw error when repository fails', async () => {
      contactRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(contactService.create(validContactData)).rejects.toThrow('Failed to create contact');
    });

    it('should collect multiple validation errors', async () => {
      const invalidData = { 
        firstName: '', 
        lastName: '', 
        email: 'invalid' 
      };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details.length).toBeGreaterThan(1);
      }
    });
  });

  describe('update', () => {
    const validContactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    it('should update contact when it exists and data is valid', async () => {
      const existingContact = { id: 1, firstName: 'Jane', lastName: 'Smith' };
      const updatedContact = { id: 1, ...validContactData };
      
      contactRepository.findById.mockResolvedValue(existingContact);
      contactRepository.update.mockResolvedValue(updatedContact);

      const result = await contactService.update(1, validContactData);

      expect(result).toEqual(updatedContact);
      expect(contactRepository.findById).toHaveBeenCalledWith(1);
      expect(contactRepository.update).toHaveBeenCalledWith(1, validContactData);
    });

    it('should throw 404 error when contact does not exist', async () => {
      contactRepository.findById.mockResolvedValue(null);

      try {
        await contactService.update(999, validContactData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Contact not found');
        expect(error.statusCode).toBe(404);
      }
      
      expect(contactRepository.update).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid data', async () => {
      const existingContact = { id: 1, firstName: 'Jane', lastName: 'Smith' };
      const invalidData = { firstName: '', lastName: 'Doe' };
      
      contactRepository.findById.mockResolvedValue(existingContact);

      try {
        await contactService.update(1, invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }
      
      expect(contactRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when repository update fails', async () => {
      const existingContact = { id: 1, firstName: 'Jane', lastName: 'Smith' };
      
      contactRepository.findById.mockResolvedValue(existingContact);
      contactRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(contactService.update(1, validContactData)).rejects.toThrow('Failed to update contact');
    });

    it('should validate all fields when updating', async () => {
      const existingContact = { id: 1, firstName: 'Jane', lastName: 'Smith' };
      const invalidData = { 
        firstName: 'John', 
        lastName: 'Doe', 
        email: 'invalid-email' 
      };
      
      contactRepository.findById.mockResolvedValue(existingContact);

      try {
        await contactService.update(1, invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'email', message: 'Invalid email format' });
      }
    });
  });

  describe('remove', () => {
    it('should delete contact when it exists', async () => {
      const existingContact = { id: 1, firstName: 'John', lastName: 'Doe' };
      
      contactRepository.findById.mockResolvedValue(existingContact);
      contactRepository.delete.mockResolvedValue();

      await contactService.remove(1);

      expect(contactRepository.findById).toHaveBeenCalledWith(1);
      expect(contactRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw 404 error when contact does not exist', async () => {
      contactRepository.findById.mockResolvedValue(null);

      try {
        await contactService.remove(999);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Contact not found');
        expect(error.statusCode).toBe(404);
      }
      
      expect(contactRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when repository delete fails', async () => {
      const existingContact = { id: 1, firstName: 'John', lastName: 'Doe' };
      
      contactRepository.findById.mockResolvedValue(existingContact);
      contactRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(contactService.remove(1)).rejects.toThrow('Failed to delete contact');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values for optional fields', async () => {
      const dataWithNulls = { 
        firstName: 'John', 
        lastName: 'Doe', 
        email: null, 
        phone: null, 
        company: null, 
        notes: null 
      };
      const mockCreatedContact = { id: 1, ...dataWithNulls };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(dataWithNulls);

      expect(result).toEqual(mockCreatedContact);
    });

    it('should handle undefined values for optional fields', async () => {
      const dataWithUndefined = { 
        firstName: 'John', 
        lastName: 'Doe', 
        email: undefined, 
        phone: undefined 
      };
      const mockCreatedContact = { id: 1, ...dataWithUndefined };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(dataWithUndefined);

      expect(result).toEqual(mockCreatedContact);
    });

    it('should trim whitespace when validating firstName', async () => {
      const dataWithWhitespace = { firstName: '   ', lastName: 'Doe' };

      try {
        await contactService.create(dataWithWhitespace);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'firstName', message: 'First name cannot be empty' });
      }
    });

    it('should accept firstName at exactly 50 characters', async () => {
      const dataWith50Chars = { firstName: 'a'.repeat(50), lastName: 'Doe' };
      const mockCreatedContact = { id: 1, ...dataWith50Chars };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(dataWith50Chars);

      expect(result).toEqual(mockCreatedContact);
    });

    it('should accept email at exactly 100 characters', async () => {
      const email = 'a'.repeat(88) + '@example.com'; // exactly 100 chars
      const dataWith100CharEmail = { firstName: 'John', lastName: 'Doe', email };
      const mockCreatedContact = { id: 1, ...dataWith100CharEmail };
      contactRepository.create.mockResolvedValue(mockCreatedContact);

      const result = await contactService.create(dataWith100CharEmail);

      expect(result).toEqual(mockCreatedContact);
    });

    it('should handle non-string firstName type', async () => {
      const invalidData = { firstName: 123, lastName: 'Doe' };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'firstName', message: 'First name is required' });
      }
    });

    it('should handle non-string lastName type', async () => {
      const invalidData = { firstName: 'John', lastName: 123 };

      try {
        await contactService.create(invalidData);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details).toContainEqual({ field: 'lastName', message: 'Last name is required' });
      }
    });
  });
});

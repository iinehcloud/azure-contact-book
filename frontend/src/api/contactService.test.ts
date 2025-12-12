import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  Contact,
  ContactInput,
} from './contactService';
import apiClient from './config';

// Mock the apiClient module
jest.mock('./config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Contact API Service', () => {
  // Sample test data
  const mockContact: Contact = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    notes: 'Test contact',
    createdAt: '2025-12-07T10:00:00Z',
    updatedAt: '2025-12-07T10:00:00Z',
  };

  const mockContactInput: ContactInput = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    notes: 'Test contact',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllContacts', () => {
    it('should fetch all contacts successfully', async () => {
      const mockContacts = [mockContact, { ...mockContact, id: 2, firstName: 'Jane' }];
      mockedApiClient.get.mockResolvedValueOnce({ data: mockContacts } as any);

      const result = await getAllContacts();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/contacts');
      expect(result).toEqual(mockContacts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no contacts exist', async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: [] } as any);

      const result = await getAllContacts();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValueOnce(networkError);

      await expect(getAllContacts()).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      mockedApiClient.get.mockRejectedValueOnce(apiError);

      await expect(getAllContacts()).rejects.toEqual(apiError);
    });
  });

  describe('getContactById', () => {
    it('should fetch a single contact successfully', async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: mockContact } as any);

      const result = await getContactById(1);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/contacts/1');
      expect(result).toEqual(mockContact);
    });

    it('should handle contact not found error', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Contact not found' },
        },
      };
      mockedApiClient.get.mockRejectedValueOnce(notFoundError);

      await expect(getContactById(999)).rejects.toEqual(notFoundError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValueOnce(networkError);

      await expect(getContactById(1)).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      mockedApiClient.get.mockRejectedValueOnce(apiError);

      await expect(getContactById(1)).rejects.toEqual(apiError);
    });
  });

  describe('createContact', () => {
    it('should create a contact successfully', async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: mockContact } as any);

      const result = await createContact(mockContactInput);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/contacts', mockContactInput);
      expect(result).toEqual(mockContact);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: [
              { field: 'email', message: 'Invalid email format' },
            ],
          },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(validationError);

      await expect(createContact(mockContactInput)).rejects.toEqual(validationError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.post.mockRejectedValueOnce(networkError);

      await expect(createContact(mockContactInput)).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      mockedApiClient.post.mockRejectedValueOnce(apiError);

      await expect(createContact(mockContactInput)).rejects.toEqual(apiError);
    });
  });

  describe('updateContact', () => {
    it('should update a contact successfully', async () => {
      const updatedContact = { ...mockContact, firstName: 'Jane' };
      mockedApiClient.put.mockResolvedValueOnce({ data: updatedContact } as any);

      const result = await updateContact(1, { ...mockContactInput, firstName: 'Jane' });

      expect(mockedApiClient.put).toHaveBeenCalledWith('/api/contacts/1', {
        ...mockContactInput,
        firstName: 'Jane',
      });
      expect(result).toEqual(updatedContact);
    });

    it('should handle contact not found error', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Contact not found' },
        },
      };
      mockedApiClient.put.mockRejectedValueOnce(notFoundError);

      await expect(updateContact(999, mockContactInput)).rejects.toEqual(notFoundError);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: [
              { field: 'firstName', message: 'First name is required' },
            ],
          },
        },
      };
      mockedApiClient.put.mockRejectedValueOnce(validationError);

      await expect(updateContact(1, mockContactInput)).rejects.toEqual(validationError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.put.mockRejectedValueOnce(networkError);

      await expect(updateContact(1, mockContactInput)).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      mockedApiClient.put.mockRejectedValueOnce(apiError);

      await expect(updateContact(1, mockContactInput)).rejects.toEqual(apiError);
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: null } as any);

      await deleteContact(1);

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/api/contacts/1');
    });

    it('should handle contact not found error', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Contact not found' },
        },
      };
      mockedApiClient.delete.mockRejectedValueOnce(notFoundError);

      await expect(deleteContact(999)).rejects.toEqual(notFoundError);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.delete.mockRejectedValueOnce(networkError);

      await expect(deleteContact(1)).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };
      mockedApiClient.delete.mockRejectedValueOnce(apiError);

      await expect(deleteContact(1)).rejects.toEqual(apiError);
    });
  });
});

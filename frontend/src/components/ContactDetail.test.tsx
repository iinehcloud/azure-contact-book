import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactDetail from './ContactDetail';
import * as contactService from '../api/contactService';
import { Contact } from '../api/contactService';

// Mock the contact service
jest.mock('../api/contactService');

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

const mockedContactService = contactService as jest.Mocked<typeof contactService>;

describe('ContactDetail Component', () => {
  const mockContact: Contact = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    notes: 'Test contact notes',
    createdAt: '2025-12-07T10:00:00Z',
    updatedAt: '2025-12-07T11:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
  });

  const renderComponent = () => {
    return render(<ContactDetail />);
  };

  describe('Loading State', () => {
    it('should render loading state while fetching contact', () => {
      // Mock a delayed response
      mockedContactService.getContactById.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText('Loading contact...')).toBeInTheDocument();
    });
  });

  describe('Contact Details Rendering', () => {
    it('should render contact details after successful fetch', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      // Check that contact details are rendered
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Test contact notes')).toBeInTheDocument();
    });

    it('should render contact with only required fields', async () => {
      const minimalContact: Contact = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        createdAt: '2025-12-07T10:00:00Z',
        updatedAt: '2025-12-07T10:00:00Z',
      };

      mockedContactService.getContactById.mockResolvedValueOnce(minimalContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('Smith')).toBeInTheDocument();
      
      // Optional fields should not be rendered
      expect(screen.queryByText(/Email:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Phone:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Company:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument();
    });

    it('should display formatted timestamps', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      // Check that timestamp labels are present
      expect(screen.getByText('Created:')).toBeInTheDocument();
      expect(screen.getByText('Last Updated:')).toBeInTheDocument();
    });

    it('should call getContactById with correct ID', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(mockedContactService.getContactById).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Error State', () => {
    it('should render error message when fetch fails', async () => {
      const errorMessage = 'Failed to load contact';
      mockedContactService.getContactById.mockRejectedValueOnce(new Error(errorMessage));

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load contact')).toBeInTheDocument();
      expect(screen.getByText('Back to Contacts')).toBeInTheDocument();
    });

    it('should render generic error message when error has no message', async () => {
      mockedContactService.getContactById.mockRejectedValueOnce({});

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load contact')).toBeInTheDocument();
    });

    it('should navigate back to list when back button is clicked in error state', async () => {
      mockedContactService.getContactById.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Contacts');
      await userEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Not Found State', () => {
    it('should render not found message when contact does not exist', async () => {
      const notFoundError = {
        response: { status: 404 },
        message: 'Contact not found',
      };
      mockedContactService.getContactById.mockRejectedValueOnce(notFoundError);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Contact not found')).toBeInTheDocument();
      expect(screen.getByText('Back to Contacts')).toBeInTheDocument();
    });

    it('should handle missing contact ID', async () => {
      mockUseParams.mockReturnValue({ id: undefined });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contact...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('No contact ID provided')).toBeInTheDocument();
    });
  });

  describe('Edit Button Navigation', () => {
    it('should navigate to edit form when edit button is clicked', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/contacts/1/edit');
    });

    it('should render edit button in detail view', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation and Execution', () => {
    it('should show delete confirmation dialog when delete button is clicked', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete John Doe/)).toBeInTheDocument();
      expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should close confirmation dialog when cancel button is clicked', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
    });

    it('should delete contact and navigate to list when confirmed', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.deleteContact.mockResolvedValueOnce(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      // Confirm delete
      const confirmButton = screen.getByText('Yes, Delete');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockedContactService.deleteContact).toHaveBeenCalledWith(1);
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should show deleting state during delete operation', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.deleteContact.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      // Confirm delete
      const confirmButton = screen.getByText('Yes, Delete');
      await userEvent.click(confirmButton);

      // Should show deleting state
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });
    });

    it('should display error message when delete fails', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.deleteContact.mockRejectedValueOnce(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      // Confirm delete
      const confirmButton = screen.getByText('Yes, Delete');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument();
      });

      // Dialog should be closed
      expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
    });

    it('should disable buttons during delete operation', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.deleteContact.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete');
      await userEvent.click(deleteButton);

      // Confirm delete
      const confirmButton = screen.getByText('Yes, Delete');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeDisabled();
        expect(screen.getByText('Cancel')).toBeDisabled();
      });
    });
  });

  describe('Back Navigation', () => {
    it('should navigate back to list when back button is clicked', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Contacts');
      await userEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});

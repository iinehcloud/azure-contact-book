import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactList from './ContactList';
import * as contactService from '../api/contactService';
import { Contact } from '../api/contactService';
import { mockNavigate } from '../__mocks__/react-router-dom';

// Mock the contact service
jest.mock('../api/contactService');

// Mock react-router-dom
jest.mock('react-router-dom');

const mockedContactService = contactService as jest.Mocked<typeof contactService>;

describe('ContactList Component', () => {
  const mockContacts: Contact[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
      notes: 'Test contact',
      createdAt: '2025-12-07T10:00:00Z',
      updatedAt: '2025-12-07T10:00:00Z',
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0456',
      company: 'Tech Inc',
      notes: 'Another contact',
      createdAt: '2025-12-07T11:00:00Z',
      updatedAt: '2025-12-07T11:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<ContactList />);
  };

  describe('Loading State', () => {
    it('should render loading state while fetching contacts', () => {
      // Mock a delayed response
      mockedContactService.getAllContacts.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Contact List Rendering', () => {
    it('should render contact list after successful fetch', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      // Check that contacts are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    });

    it('should render empty state when no contacts exist', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No contacts found/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first contact/i)).toBeInTheDocument();
    });

    it('should render contact cards with all available information', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce([mockContacts[0]]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('should render contact cards without optional fields', async () => {
      const minimalContact: Contact = {
        id: 3,
        firstName: 'Bob',
        lastName: 'Johnson',
        createdAt: '2025-12-07T12:00:00Z',
        updatedAt: '2025-12-07T12:00:00Z',
      };

      mockedContactService.getAllContacts.mockResolvedValueOnce([minimalContact]);

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      // Optional fields should not be rendered
      expect(screen.queryByText(/✉/)).not.toBeInTheDocument();
      expect(screen.queryByText(/📞/)).not.toBeInTheDocument();
      expect(screen.queryByText(/🏢/)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when fetch fails', async () => {
      const errorMessage = 'Failed to load contacts';
      mockedContactService.getAllContacts.mockRejectedValueOnce(new Error(errorMessage));

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to load contacts/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should render generic error message when error has no message', async () => {
      mockedContactService.getAllContacts.mockRejectedValueOnce({});

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to load contacts. Please try again./i)).toBeInTheDocument();
    });

    it('should retry fetching contacts when retry button is clicked', async () => {
      mockedContactService.getAllContacts
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockContacts);

      renderComponent();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      // Wait for successful fetch
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(mockedContactService.getAllContacts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navigation', () => {
    it('should navigate to contact detail view when contact card is clicked', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click on the first contact card
      const contactCard = screen.getByText('John Doe').closest('.contact-card');
      expect(contactCard).toBeInTheDocument();
      
      await userEvent.click(contactCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/contacts/1');
    });

    it('should navigate to different contact details when different cards are clicked', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Click on the second contact card
      const contactCard = screen.getByText('Jane Smith').closest('.contact-card');
      expect(contactCard).toBeInTheDocument();
      
      await userEvent.click(contactCard!);

      expect(mockNavigate).toHaveBeenCalledWith('/contacts/2');
    });

    it('should navigate to create form when "New Contact" button is clicked', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click the "New Contact" button in the header
      const createButton = screen.getByText('+ New Contact');
      await userEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/contacts/new');
    });

    it('should navigate to create form when "Create Contact" button is clicked in empty state', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No contacts found/i)).toBeInTheDocument();
      });

      // Click the "Create Contact" button in empty state
      const createButton = screen.getByText('Create Contact');
      await userEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/contacts/new');
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch contacts on component mount', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      await waitFor(() => {
        expect(mockedContactService.getAllContacts).toHaveBeenCalledTimes(1);
      });
    });

    it('should display header with title', async () => {
      mockedContactService.getAllContacts.mockResolvedValueOnce(mockContacts);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Contacts')).toBeInTheDocument();
      });
    });
  });
});

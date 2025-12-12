import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';
import * as contactService from '../api/contactService';
import { Contact } from '../api/contactService';

// Mock the contact service
jest.mock('../api/contactService');

const mockedContactService = contactService as jest.Mocked<typeof contactService>;

describe('ContactForm Component', () => {
  const mockOnSave = jest.fn();

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (contactId?: number) => {
    return render(<ContactForm contactId={contactId} onSave={mockOnSave} />);
  };

  describe('Form Rendering - Create Mode', () => {
    it('should render form with empty fields for create', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /Create Contact/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Email/i)).toHaveValue('');
      expect(screen.getByLabelText(/Phone/i)).toHaveValue('');
      expect(screen.getByLabelText(/Company/i)).toHaveValue('');
      expect(screen.getByLabelText(/Notes/i)).toHaveValue('');
    });

    it('should render submit button with "Create Contact" text', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Create Contact/i })).toBeInTheDocument();
    });

    it('should render required field indicators', () => {
      renderComponent();

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(2); // firstName and lastName
    });
  });

  describe('Form Rendering - Edit Mode', () => {
    it('should render loading state while fetching contact data', () => {
      mockedContactService.getContactById.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent(1);

      expect(screen.getByText('Loading contact data...')).toBeInTheDocument();
    });

    it('should load existing contact data for edit', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent(1);

      await waitFor(() => {
        expect(screen.queryByText('Loading contact data...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Doe');
      expect(screen.getByLabelText(/Email/i)).toHaveValue('john.doe@example.com');
      expect(screen.getByLabelText(/Phone/i)).toHaveValue('+1-555-0123');
      expect(screen.getByLabelText(/Company/i)).toHaveValue('Acme Corp');
      expect(screen.getByLabelText(/Notes/i)).toHaveValue('Test contact');
    });

    it('should render submit button with "Update Contact" text in edit mode', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);

      renderComponent(1);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Contact/i })).toBeInTheDocument();
      });
    });

    it('should handle contact with null optional fields', async () => {
      const minimalContact: Contact = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        createdAt: '2025-12-07T11:00:00Z',
        updatedAt: '2025-12-07T11:00:00Z',
      };

      mockedContactService.getContactById.mockResolvedValueOnce(minimalContact);

      renderComponent(2);

      await waitFor(() => {
        expect(screen.queryByText('Loading contact data...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(/First Name/i)).toHaveValue('Jane');
      expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Smith');
      expect(screen.getByLabelText(/Email/i)).toHaveValue('');
      expect(screen.getByLabelText(/Phone/i)).toHaveValue('');
      expect(screen.getByLabelText(/Company/i)).toHaveValue('');
      expect(screen.getByLabelText(/Notes/i)).toHaveValue('');
    });

    it('should display error message if loading contact fails', async () => {
      mockedContactService.getContactById.mockRejectedValueOnce(new Error('Not found'));

      renderComponent(1);

      await waitFor(() => {
        expect(screen.getByText('Failed to load contact data')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when firstName is empty', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should show error when lastName is empty', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('should show error when firstName exceeds 50 characters', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await userEvent.type(firstNameInput, 'a'.repeat(51));

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be 50 characters or less')).toBeInTheDocument();
      });
    });

    it('should show error when lastName exceeds 50 characters', async () => {
      renderComponent();

      const lastNameInput = screen.getByLabelText(/Last Name/i);
      await userEvent.type(lastNameInput, 'b'.repeat(51));

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Last name must be 50 characters or less')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('should show error for invalid phone format', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const phoneInput = screen.getByLabelText(/Phone/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(phoneInput, 'abc-def-ghij');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone format')).toBeInTheDocument();
      });
    });

    it('should show error when company exceeds 100 characters', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const companyInput = screen.getByLabelText(/Company/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(companyInput, 'c'.repeat(101));

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company must be 100 characters or less')).toBeInTheDocument();
      });
    });

    it('should show error when notes exceed 500 characters', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const notesInput = screen.getByLabelText(/Notes/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(notesInput, 'n'.repeat(501));

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Notes must be 500 characters or less')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await userEvent.type(firstNameInput, 'John');

      await waitFor(() => {
        expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
      });
    });

    it('should accept valid email formats', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(emailInput, 'john.doe@example.com');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
      });
    });

    it('should accept valid phone formats', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const phoneInput = screen.getByLabelText(/Phone/i);

      await userEvent.type(firstNameInput, 'John');
      await userEvent.type(lastNameInput, 'Doe');
      await userEvent.type(phoneInput, '+1-555-0123');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid phone format')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Create', () => {
    it('should successfully create contact with valid data', async () => {
      const newContact = { ...mockContact, id: 3 };
      mockedContactService.createContact.mockResolvedValueOnce(newContact);

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/Email/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '+1-555-0123');
      await userEvent.type(screen.getByLabelText(/Company/i), 'Acme Corp');
      await userEvent.type(screen.getByLabelText(/Notes/i), 'Test contact');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedContactService.createContact).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          company: 'Acme Corp',
          notes: 'Test contact',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(3);
    });

    it('should create contact with only required fields', async () => {
      const newContact: Contact = {
        id: 4,
        firstName: 'Jane',
        lastName: 'Smith',
        createdAt: '2025-12-07T12:00:00Z',
        updatedAt: '2025-12-07T12:00:00Z',
      };
      mockedContactService.createContact.mockResolvedValueOnce(newContact);

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'Jane');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Smith');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedContactService.createContact).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Smith',
          email: undefined,
          phone: undefined,
          company: undefined,
          notes: undefined,
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(4);
    });

    it('should show loading state during submission', async () => {
      mockedContactService.createContact.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
    });

    it('should disable form inputs during submission', async () => {
      mockedContactService.createContact.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/i)).toBeDisabled();
        expect(screen.getByLabelText(/Last Name/i)).toBeDisabled();
        expect(screen.getByLabelText(/Email/i)).toBeDisabled();
      });
    });

    it('should trim whitespace from input values', async () => {
      const newContact = { ...mockContact, id: 5 };
      mockedContactService.createContact.mockResolvedValueOnce(newContact);

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), '  John  ');
      await userEvent.type(screen.getByLabelText(/Last Name/i), '  Doe  ');
      await userEvent.type(screen.getByLabelText(/Email/i), '  john@example.com  ');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedContactService.createContact).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: undefined,
          company: undefined,
          notes: undefined,
        });
      });
    });
  });

  describe('Form Submission - Update', () => {
    it('should successfully update contact with valid data', async () => {
      const updatedContact = { ...mockContact, firstName: 'Johnny' };
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.updateContact.mockResolvedValueOnce(updatedContact);

      renderComponent(1);

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
      });

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await userEvent.clear(firstNameInput);
      await userEvent.type(firstNameInput, 'Johnny');

      const submitButton = screen.getByRole('button', { name: /Update Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedContactService.updateContact).toHaveBeenCalledWith(1, {
          firstName: 'Johnny',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          company: 'Acme Corp',
          notes: 'Test contact',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(1);
    });

    it('should call updateContact instead of createContact in edit mode', async () => {
      mockedContactService.getContactById.mockResolvedValueOnce(mockContact);
      mockedContactService.updateContact.mockResolvedValueOnce(mockContact);

      renderComponent(1);

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
      });

      const submitButton = screen.getByRole('button', { name: /Update Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedContactService.updateContact).toHaveBeenCalled();
        expect(mockedContactService.createContact).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when submission fails', async () => {
      mockedContactService.createContact.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should display generic error message when error has no message', async () => {
      mockedContactService.createContact.mockRejectedValueOnce({});

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save contact')).toBeInTheDocument();
      });
    });

    it('should handle backend validation errors', async () => {
      const backendError = {
        response: {
          data: {
            error: 'Validation failed',
            details: [
              { field: 'email', message: 'Email already exists' },
              { field: 'phone', message: 'Invalid phone number' },
            ],
          },
        },
      };
      mockedContactService.createContact.mockRejectedValueOnce(backendError);

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/Email/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText(/Phone/i), '123');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
        expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear submit error when form is resubmitted', async () => {
      mockedContactService.createContact
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ...mockContact, id: 6 });

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Resubmit
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });

    it('should display error with role="alert" for accessibility', async () => {
      mockedContactService.createContact.mockRejectedValueOnce(
        new Error('Server error')
      );

      renderComponent();

      await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
      await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveTextContent('Server error');
      });
    });
  });

  describe('Form Interaction', () => {
    it('should update form state when user types in fields', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await userEvent.type(firstNameInput, 'John');

      expect(firstNameInput).toHaveValue('John');
    });

    it('should handle textarea input for notes field', async () => {
      renderComponent();

      const notesInput = screen.getByLabelText(/Notes/i);
      await userEvent.type(notesInput, 'This is a test note');

      expect(notesInput).toHaveValue('This is a test note');
    });

    it('should not submit form when validation fails', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /Create Contact/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      expect(mockedContactService.createContact).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});

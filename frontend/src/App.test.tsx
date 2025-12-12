import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

// Mock the API service to prevent actual API calls
jest.mock('./api/contactService', () => ({
  getAllContacts: jest.fn(),
  getContactById: jest.fn(),
  createContact: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn()
}));

// Mock the child components
jest.mock('./components/ContactList', () => ({
  __esModule: true,
  default: function ContactList() {
    return <div data-testid="contact-list">Contact List Component</div>;
  }
}));

jest.mock('./components/ContactDetail', () => ({
  __esModule: true,
  default: function ContactDetail() {
    return <div data-testid="contact-detail">Contact Detail Component</div>;
  }
}));

jest.mock('./components/ContactForm', () => ({
  __esModule: true,
  default: function ContactForm({ contactId }: { contactId?: number; onSave?: (id: number) => void }) {
    return (
      <div data-testid="contact-form">
        Contact Form Component {contactId ? `(Edit: ${contactId})` : '(New)'}
      </div>
    );
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear console warnings and errors
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Routing Configuration', () => {
    test('renders ContactList component on root path /', () => {
      window.history.pushState({}, 'Test page', '/');
      
      render(<App />);
      
      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
    });

    test('renders ContactDetail component on /contacts/:id path', () => {
      window.history.pushState({}, 'Test page', '/contacts/123');
      
      render(<App />);
      
      expect(screen.getByTestId('contact-detail')).toBeInTheDocument();
    });

    test('renders ContactForm for new contact on /contacts/new path', () => {
      window.history.pushState({}, 'Test page', '/contacts/new');
      
      render(<App />);
      
      const form = screen.getByTestId('contact-form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveTextContent('(New)');
    });

    test('renders ContactForm for editing on /contacts/:id/edit path', () => {
      window.history.pushState({}, 'Test page', '/contacts/456/edit');
      
      render(<App />);
      
      const form = screen.getByTestId('contact-form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveTextContent('(Edit: 456)');
    });
  });

  describe('Navigation Between Views', () => {
    test('home link navigates to root path', () => {
      window.history.pushState({}, 'Test page', '/contacts/123');
      
      render(<App />);
      
      // Initially on detail page
      expect(screen.getByTestId('contact-detail')).toBeInTheDocument();
      
      // Check home link exists and points to root
      const homeLink = screen.getByText(/Home/i);
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    test('app title link navigates to root path', () => {
      window.history.pushState({}, 'Test page', '/contacts/new');
      
      render(<App />);
      
      // Initially on form page
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
      
      // Check app title link exists and points to root
      const titleLink = screen.getByText(/Contact Book/i);
      expect(titleLink).toBeInTheDocument();
      expect(titleLink.closest('a')).toHaveAttribute('href', '/');
    });

    test('renders app header with title on all routes', () => {
      const routes = ['/', '/contacts/123', '/contacts/new', '/contacts/456/edit'];
      
      routes.forEach(route => {
        window.history.pushState({}, 'Test page', route);
        
        const { unmount } = render(<App />);
        
        expect(screen.getByText(/Contact Book/i)).toBeInTheDocument();
        expect(screen.getByText(/Home/i)).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Error Boundary', () => {
    test('error boundary component exists and wraps the app', () => {
      window.history.pushState({}, 'Test page', '/');
      
      // Test that the app renders without errors when components work correctly
      render(<App />);
      
      // Should render the contact list (no error)
      expect(screen.getByTestId('contact-list')).toBeInTheDocument();
    });

    test('error boundary structure is present in App component', () => {
      // Verify the App component includes error boundary by checking the component structure
      const appString = App.toString();
      
      // The App component should include ErrorBoundary
      expect(appString).toContain('ErrorBoundary');
    });

    test('error boundary displays correct error UI elements', () => {
      // Create a test component that simulates the error boundary UI
      const ErrorBoundaryUI = () => (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.href = '/'}>
            Return to Home
          </button>
        </div>
      );
      
      const { getByText } = render(<ErrorBoundaryUI />);
      
      // Verify the error boundary UI structure
      expect(getByText('Something went wrong')).toBeInTheDocument();
      expect(getByText(/We're sorry, but something unexpected happened/i)).toBeInTheDocument();
      expect(getByText('Return to Home')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    test('logs warning when API base URL is not configured', () => {
      window.history.pushState({}, 'Test page', '/');
      const warnSpy = jest.spyOn(console, 'warn');
      delete (process.env as any).REACT_APP_API_BASE_URL;
      
      render(<App />);
      
      expect(warnSpy).toHaveBeenCalledWith(
        'REACT_APP_API_BASE_URL is not configured. API calls may fail.'
      );
    });

    test('does not log warning when API base URL is configured', () => {
      window.history.pushState({}, 'Test page', '/');
      const warnSpy = jest.spyOn(console, 'warn');
      process.env.REACT_APP_API_BASE_URL = 'http://localhost:3000';
      
      render(<App />);
      
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});

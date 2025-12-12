import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import ContactList from './components/ContactList';
import ContactDetail from './components/ContactDetail';
import ContactForm from './components/ContactForm';
import './App.css';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.href = '/'}>
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper components to handle route parameters and navigation
function ContactFormEditWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const handleSave = (contactId: number) => {
    navigate(`/contacts/${contactId}`);
  };
  
  return <ContactForm contactId={Number(id)} onSave={handleSave} />;
}

function ContactFormNewWrapper() {
  const navigate = useNavigate();
  
  const handleSave = (contactId: number) => {
    navigate(`/contacts/${contactId}`);
  };
  
  return <ContactForm onSave={handleSave} />;
}

function App() {
  // Load API base URL from environment variable
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  
  // Log warning if API base URL is not configured
  if (!apiBaseUrl) {
    console.warn('REACT_APP_API_BASE_URL is not configured. API calls may fail.');
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          {/* Navigation Header */}
          <header className="app-header">
            <div className="header-content">
              <Link to="/" className="app-title">
                <h1>Contact Book</h1>
              </Link>
              <nav className="app-nav">
                <Link to="/" className="nav-link">Home</Link>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="app-main">
            <Routes>
              <Route path="/" element={<ContactList />} />
              <Route path="/contacts/new" element={<ContactFormNewWrapper />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/contacts/:id/edit" element={<ContactFormEditWrapper />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

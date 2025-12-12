import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllContacts, Contact } from '../api/contactService';
import './ContactList.css';

/**
 * ContactList component displays all contacts in a responsive grid/list layout
 * Fetches contacts on mount and provides navigation to detail and create views
 */
const ContactList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllContacts();
      setContacts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (id: number) => {
    navigate(`/contacts/${id}`);
  };

  const handleCreateClick = () => {
    navigate('/contacts/new');
  };

  if (loading) {
    return (
      <div className="contact-list-container">
        <div className="loading-spinner" role="status">
          <div className="spinner"></div>
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contact-list-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchContacts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-list-container">
      <div className="contact-list-header">
        <h1>Contacts</h1>
        <button onClick={handleCreateClick} className="create-button">
          + New Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <p>No contacts found. Create your first contact to get started!</p>
          <button onClick={handleCreateClick} className="create-button-large">
            Create Contact
          </button>
        </div>
      ) : (
        <div className="contact-grid">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-card"
              onClick={() => handleContactClick(contact.id)}
            >
              <div className="contact-card-header">
                <h3>
                  {contact.firstName} {contact.lastName}
                </h3>
              </div>
              <div className="contact-card-body">
                {contact.email && (
                  <p className="contact-email">
                    <span className="icon">✉</span> {contact.email}
                  </p>
                )}
                {contact.phone && (
                  <p className="contact-phone">
                    <span className="icon">📞</span> {contact.phone}
                  </p>
                )}
                {contact.company && (
                  <p className="contact-company">
                    <span className="icon">🏢</span> {contact.company}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactList;

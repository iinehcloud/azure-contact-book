import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContactById, deleteContact } from '../api/contactService';
import './ContactDetail.css';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      if (!id) {
        setError('No contact ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getContactById(parseInt(id, 10));
        setContact(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Contact not found');
        } else {
          setError(err.message || 'Failed to load contact');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;

    try {
      setDeleting(true);
      setError('');
      await deleteContact(parseInt(id, 10));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/contacts/${id}/edit`);
  };

  if (loading) {
    return (
      <div className="contact-detail">
        <div className="loading">Loading contact...</div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="contact-detail">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Back to Contacts
        </button>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="contact-detail">
        <div className="error">Contact not found</div>
        <button onClick={() => navigate('/')} className="btn-back">
          Back to Contacts
        </button>
      </div>
    );
  }

  return (
    <div className="contact-detail">
      <div className="detail-header">
        <h2>Contact Details</h2>
        <div className="detail-actions">
          <button onClick={handleEdit} className="btn-edit">
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-delete"
            disabled={deleting}
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="detail-content">
        <div className="detail-field">
          <label>First Name:</label>
          <span>{contact.firstName}</span>
        </div>

        <div className="detail-field">
          <label>Last Name:</label>
          <span>{contact.lastName}</span>
        </div>

        {contact.email && (
          <div className="detail-field">
            <label>Email:</label>
            <span>{contact.email}</span>
          </div>
        )}

        {contact.phone && (
          <div className="detail-field">
            <label>Phone:</label>
            <span>{contact.phone}</span>
          </div>
        )}

        {contact.company && (
          <div className="detail-field">
            <label>Company:</label>
            <span>{contact.company}</span>
          </div>
        )}

        {contact.notes && (
          <div className="detail-field">
            <label>Notes:</label>
            <span className="notes">{contact.notes}</span>
          </div>
        )}

        <div className="detail-field">
          <label>Created:</label>
          <span>{new Date(contact.createdAt).toLocaleString()}</span>
        </div>

        <div className="detail-field">
          <label>Last Updated:</label>
          <span>{new Date(contact.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      <button onClick={() => navigate('/')} className="btn-back">
        Back to Contacts
      </button>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete {contact.firstName}{' '}
              {contact.lastName}? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleDelete}
                className="btn-confirm-delete"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-cancel"
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetail;

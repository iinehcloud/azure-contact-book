import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { getContactById, createContact, updateContact, ContactInput } from '../api/contactService';
import './ContactForm.css';

interface ContactFormProps {
  contactId?: number;
  onSave: (contactId: number) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ contactId, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Fetch existing contact data if editing
  useEffect(() => {
    if (contactId) {
      setFetchingData(true);
      getContactById(contactId)
        .then(contact => {
          setFormData({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            notes: contact.notes || ''
          });
          setFetchingData(false);
        })
        .catch(error => {
          setSubmitError('Failed to load contact data');
          setFetchingData(false);
        });
    }
  }, [contactId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // firstName: Required, 1-50 characters
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be 50 characters or less';
    }

    // lastName: Required, 1-50 characters
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be 50 characters or less';
    }

    // email: Optional, valid email format
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    // phone: Optional, valid phone format
    if (formData.phone && formData.phone.trim()) {
      // const phoneRegex = /^[\d\s\-\+\(\)]+$/; //Correct fix (clean & ESLint-safe)
      const phoneRegex = /^[\d\s()+-]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Invalid phone format';
      }
    }

    // company: Optional, max 100 characters
    if (formData.company && formData.company.length > 100) {
      newErrors.company = 'Company must be 100 characters or less';
    }

    // notes: Optional, max 500 characters
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare contact data, converting empty strings to undefined
      const contactData: ContactInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      let savedContact;
      if (contactId) {
        savedContact = await updateContact(contactId, contactData);
      } else {
        savedContact = await createContact(contactData);
      }

      setLoading(false);
      onSave(savedContact.id);
    } catch (error: any) {
      setLoading(false);
      if (error.response?.data?.details) {
        // Handle validation errors from backend
        const backendErrors: ValidationErrors = {};
        error.response.data.details.forEach((detail: any) => {
          backendErrors[detail.field as keyof ValidationErrors] = detail.message;
        });
        setErrors(backendErrors);
      } else {
        setSubmitError(error.message || 'Failed to save contact');
      }
    }
  };

  if (fetchingData) {
    return <div className="contact-form-loading">Loading contact data...</div>;
  }

  return (
    <div className="contact-form-container">
      <h2>{contactId ? 'Edit Contact' : 'Create Contact'}</h2>
      
      {submitError && (
        <div className="error-message" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="firstName">
            First Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? 'error' : ''}
            disabled={loading}
          />
          {errors.firstName && (
            <span className="field-error">{errors.firstName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">
            Last Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? 'error' : ''}
            disabled={loading}
          />
          {errors.lastName && (
            <span className="field-error">{errors.lastName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && (
            <span className="field-error">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
            disabled={loading}
          />
          {errors.phone && (
            <span className="field-error">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="company">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className={errors.company ? 'error' : ''}
            disabled={loading}
          />
          {errors.company && (
            <span className="field-error">{errors.company}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={errors.notes ? 'error' : ''}
            disabled={loading}
            rows={4}
          />
          {errors.notes && (
            <span className="field-error">{errors.notes}</span>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : contactId ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;

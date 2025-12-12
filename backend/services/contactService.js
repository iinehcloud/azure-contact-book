const contactRepository = require('../repositories/contactRepository');

/**
 * Find all contacts
 * @returns {Promise<Array>} Array of contact objects
 */
async function findAll() {
  try {
    return await contactRepository.findAll();
  } catch (error) {
    console.error('Service error in findAll:', error.message);
    throw new Error('Failed to retrieve contacts');
  }
}

/**
 * Find contact by ID
 * @param {number} id - Contact ID
 * @returns {Promise<Object>} Contact object
 * @throws {Error} If contact not found
 */
async function findById(id) {
  try {
    const contact = await contactRepository.findById(id);
    
    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }
    
    return contact;
  } catch (error) {
    if (error.statusCode === 404) {
      throw error;
    }
    console.error('Service error in findById:', error.message);
    throw new Error('Failed to retrieve contact');
  }
}

/**
 * Create a new contact with business validation
 * @param {Object} contactData - Contact data
 * @param {string} contactData.firstName - First name
 * @param {string} contactData.lastName - Last name
 * @param {string} [contactData.email] - Email address
 * @param {string} [contactData.phone] - Phone number
 * @param {string} [contactData.company] - Company name
 * @param {string} [contactData.notes] - Notes
 * @returns {Promise<Object>} Created contact object
 * @throws {Error} If validation fails
 */
async function create(contactData) {
  // Business validation
  const validationErrors = validateContactData(contactData);
  if (validationErrors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = validationErrors;
    throw error;
  }
  
  try {
    return await contactRepository.create(contactData);
  } catch (error) {
    console.error('Service error in create:', error.message);
    throw new Error('Failed to create contact');
  }
}

/**
 * Update an existing contact with existence check
 * @param {number} id - Contact ID
 * @param {Object} contactData - Contact data to update
 * @param {string} [contactData.firstName] - First name
 * @param {string} [contactData.lastName] - Last name
 * @param {string} [contactData.email] - Email address
 * @param {string} [contactData.phone] - Phone number
 * @param {string} [contactData.company] - Company name
 * @param {string} [contactData.notes] - Notes
 * @returns {Promise<Object>} Updated contact object
 * @throws {Error} If contact not found or validation fails
 */
async function update(id, contactData) {
  // Check if contact exists
  const existingContact = await contactRepository.findById(id);
  if (!existingContact) {
    const error = new Error('Contact not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Business validation
  const validationErrors = validateContactData(contactData);
  if (validationErrors.length > 0) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = validationErrors;
    throw error;
  }
  
  try {
    return await contactRepository.update(id, contactData);
  } catch (error) {
    console.error('Service error in update:', error.message);
    throw new Error('Failed to update contact');
  }
}

/**
 * Remove a contact with existence check
 * @param {number} id - Contact ID
 * @returns {Promise<void>}
 * @throws {Error} If contact not found
 */
async function remove(id) {
  // Check if contact exists
  const existingContact = await contactRepository.findById(id);
  if (!existingContact) {
    const error = new Error('Contact not found');
    error.statusCode = 404;
    throw error;
  }
  
  try {
    await contactRepository.delete(id);
  } catch (error) {
    console.error('Service error in remove:', error.message);
    throw new Error('Failed to delete contact');
  }
}

/**
 * Validate contact data according to business rules
 * @param {Object} contactData - Contact data to validate
 * @returns {Array} Array of validation error objects
 */
function validateContactData(contactData) {
  const errors = [];
  
  // Validate firstName
  if (!contactData.firstName || typeof contactData.firstName !== 'string') {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (contactData.firstName.trim().length === 0) {
    errors.push({ field: 'firstName', message: 'First name cannot be empty' });
  } else if (contactData.firstName.length > 50) {
    errors.push({ field: 'firstName', message: 'First name must not exceed 50 characters' });
  }
  
  // Validate lastName
  if (!contactData.lastName || typeof contactData.lastName !== 'string') {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (contactData.lastName.trim().length === 0) {
    errors.push({ field: 'lastName', message: 'Last name cannot be empty' });
  } else if (contactData.lastName.length > 50) {
    errors.push({ field: 'lastName', message: 'Last name must not exceed 50 characters' });
  }
  
  // Validate email (optional)
  if (contactData.email !== undefined && contactData.email !== null && contactData.email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    } else if (contactData.email.length > 100) {
      errors.push({ field: 'email', message: 'Email must not exceed 100 characters' });
    }
  }
  
  // Validate phone (optional)
  if (contactData.phone !== undefined && contactData.phone !== null && contactData.phone !== '') {
    if (contactData.phone.length > 20) {
      errors.push({ field: 'phone', message: 'Phone must not exceed 20 characters' });
    }
  }
  
  // Validate company (optional)
  if (contactData.company !== undefined && contactData.company !== null && contactData.company !== '') {
    if (contactData.company.length > 100) {
      errors.push({ field: 'company', message: 'Company must not exceed 100 characters' });
    }
  }
  
  // Validate notes (optional)
  if (contactData.notes !== undefined && contactData.notes !== null && contactData.notes !== '') {
    if (contactData.notes.length > 500) {
      errors.push({ field: 'notes', message: 'Notes must not exceed 500 characters' });
    }
  }
  
  return errors;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};

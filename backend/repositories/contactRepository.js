const { query } = require('../config/database');

/**
 * Map database row (snake_case) to application object (camelCase)
 * @param {Object} row - Database row
 * @returns {Object} Contact object in camelCase
 */
function mapRowToContact(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Find all contacts
 * @returns {Promise<Array>} Array of contact objects
 */
async function findAll() {
  const sql = `
    SELECT id, first_name, last_name, email, phone, company, notes, created_at, updated_at
    FROM contacts
    ORDER BY last_name, first_name
  `;
  
  try {
    const result = await query(sql, []);
    return result.rows.map(mapRowToContact);
  } catch (error) {
    console.error('Error in findAll:', error.message);
    throw error;
  }
}

/**
 * Find contact by ID
 * @param {number} id - Contact ID
 * @returns {Promise<Object|null>} Contact object or null if not found
 */
async function findById(id) {
  const sql = `
    SELECT id, first_name, last_name, email, phone, company, notes, created_at, updated_at
    FROM contacts
    WHERE id = $1
  `;
  
  try {
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? mapRowToContact(result.rows[0]) : null;
  } catch (error) {
    console.error('Error in findById:', error.message);
    throw error;
  }
}

/**
 * Create a new contact
 * @param {Object} contact - Contact data
 * @param {string} contact.firstName - First name
 * @param {string} contact.lastName - Last name
 * @param {string} [contact.email] - Email address
 * @param {string} [contact.phone] - Phone number
 * @param {string} [contact.company] - Company name
 * @param {string} [contact.notes] - Notes
 * @returns {Promise<Object>} Created contact object
 */
async function create(contact) {
  const sql = `
    INSERT INTO contacts (first_name, last_name, email, phone, company, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, first_name, last_name, email, phone, company, notes, created_at, updated_at
  `;
  
  const params = [
    contact.firstName,
    contact.lastName,
    contact.email || null,
    contact.phone || null,
    contact.company || null,
    contact.notes || null,
  ];
  
  try {
    const result = await query(sql, params);
    return mapRowToContact(result.rows[0]);
  } catch (error) {
    console.error('Error in create:', error.message);
    throw error;
  }
}

/**
 * Update an existing contact
 * @param {number} id - Contact ID
 * @param {Object} contact - Contact data to update
 * @param {string} [contact.firstName] - First name
 * @param {string} [contact.lastName] - Last name
 * @param {string} [contact.email] - Email address
 * @param {string} [contact.phone] - Phone number
 * @param {string} [contact.company] - Company name
 * @param {string} [contact.notes] - Notes
 * @returns {Promise<Object|null>} Updated contact object or null if not found
 */
async function update(id, contact) {
  const sql = `
    UPDATE contacts
    SET first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        company = $5,
        notes = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING id, first_name, last_name, email, phone, company, notes, created_at, updated_at
  `;
  
  const params = [
    contact.firstName,
    contact.lastName,
    contact.email || null,
    contact.phone || null,
    contact.company || null,
    contact.notes || null,
    id,
  ];
  
  try {
    const result = await query(sql, params);
    return result.rows.length > 0 ? mapRowToContact(result.rows[0]) : null;
  } catch (error) {
    console.error('Error in update:', error.message);
    throw error;
  }
}

/**
 * Delete a contact
 * @param {number} id - Contact ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteContact(id) {
  const sql = `
    DELETE FROM contacts
    WHERE id = $1
  `;
  
  try {
    const result = await query(sql, [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error in delete:', error.message);
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  delete: deleteContact,
};

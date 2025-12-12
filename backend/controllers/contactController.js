const contactService = require('../services/contactService');

/**
 * Get all contacts
 * @route GET /api/contacts
 */
async function getAllContacts(req, res, next) {
  try {
    const contacts = await contactService.findAll();
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
}

/**
 * Get contact by ID
 * @route GET /api/contacts/:id
 */
async function getContactById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const contact = await contactService.findById(id);
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new contact
 * @route POST /api/contacts
 */
async function createContact(req, res, next) {
  try {
    const contactData = req.body;
    const newContact = await contactService.create(contactData);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing contact
 * @route PUT /api/contacts/:id
 */
async function updateContact(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const contactData = req.body;
    const updatedContact = await contactService.update(id, contactData);
    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a contact
 * @route DELETE /api/contacts/:id
 */
async function deleteContact(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await contactService.remove(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};

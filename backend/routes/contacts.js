const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validateContact, validateId } = require('../middleware/validation');

/**
 * Contact Routes
 * Base path: /api/contacts
 */

// GET /api/contacts - Get all contacts
router.get('/', contactController.getAllContacts);

// GET /api/contacts/:id - Get single contact by ID
router.get('/:id', validateId, contactController.getContactById);

// POST /api/contacts - Create new contact
router.post('/', validateContact, contactController.createContact);

// PUT /api/contacts/:id - Update existing contact
router.put('/:id', validateId, validateContact, contactController.updateContact);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', validateId, contactController.deleteContact);

module.exports = router;

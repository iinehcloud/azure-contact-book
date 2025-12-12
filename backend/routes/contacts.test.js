const express = require('express');
const request = require('supertest');
const contactRoutes = require('./contacts');
const contactService = require('../services/contactService');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Mock the contact service
jest.mock('../services/contactService');

// Create test Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/contacts', contactRoutes);
  
  // Use the actual error handling middleware
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}

describe('Contact Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/contacts', () => {
    it('should return all contacts with 200 status', async () => {
      const mockContacts = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-555-0123',
          company: 'Acme Corp',
          notes: 'Test contact',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '555-555-0124',
          company: null,
          notes: null,
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ];

      contactService.findAll.mockResolvedValue(mockContacts);

      const response = await request(app).get('/api/contacts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContacts);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(contactService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no contacts exist', async () => {
      contactService.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/contacts');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 500 status on service error', async () => {
      contactService.findAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/contacts');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/contacts/:id', () => {
    it('should return contact by id with 200 status', async () => {
      const mockContact = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-555-0123',
        company: 'Acme Corp',
        notes: 'Test contact',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      contactService.findById.mockResolvedValue(mockContact);

      const response = await request(app).get('/api/contacts/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContact);
      expect(response.body.id).toBe(1);
      expect(contactService.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 status when contact not found', async () => {
      const notFoundError = new Error('Contact not found');
      notFoundError.statusCode = 404;
      contactService.findById.mockRejectedValue(notFoundError);

      const response = await request(app).get('/api/contacts/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 400 status for invalid id format', async () => {
      const response = await request(app).get('/api/contacts/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 status for negative id', async () => {
      const response = await request(app).get('/api/contacts/-1');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 status on service error', async () => {
      contactService.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/contacts/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/contacts', () => {
    it('should create contact with valid data and return 201 status', async () => {
      const newContactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-555-0123',
        company: 'Acme Corp',
        notes: 'New contact',
      };

      const createdContact = {
        id: 1,
        ...newContactData,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      contactService.create.mockResolvedValue(createdContact);

      const response = await request(app)
        .post('/api/contacts')
        .send(newContactData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdContact);
      expect(response.body.id).toBe(1);
      expect(response.body.firstName).toBe('John');
      expect(contactService.create).toHaveBeenCalledWith(newContactData);
    });

    it('should create contact with only required fields', async () => {
      const minimalContactData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const createdContact = {
        id: 2,
        ...minimalContactData,
        email: null,
        phone: null,
        company: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      contactService.create.mockResolvedValue(createdContact);

      const response = await request(app)
        .post('/api/contacts')
        .send(minimalContactData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Smith');
    });

    it('should return 400 status when firstName is missing', async () => {
      const invalidData = {
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ field: 'firstName' })
      );
    });

    it('should return 400 status when lastName is missing', async () => {
      const invalidData = {
        firstName: 'John',
        email: 'john@example.com',
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ field: 'lastName' })
      );
    });

    it('should return 400 status for invalid email format', async () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });

    it('should return 400 status when firstName exceeds max length', async () => {
      const invalidData = {
        firstName: 'A'.repeat(51),
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 status on service error', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      contactService.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/contacts')
        .send(validData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/contacts/:id', () => {
    it('should update contact with valid data and return 200 status', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.updated@example.com',
        phone: '555-555-9999',
        company: 'New Corp',
        notes: 'Updated notes',
      };

      const updatedContact = {
        id: 1,
        ...updateData,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      contactService.update.mockResolvedValue(updatedContact);

      const response = await request(app)
        .put('/api/contacts/1')
        .send(updateData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedContact);
      expect(response.body.email).toBe('john.updated@example.com');
      expect(contactService.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 status when contact not found', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const notFoundError = new Error('Contact not found');
      notFoundError.statusCode = 404;
      contactService.update.mockRejectedValue(notFoundError);

      const response = await request(app)
        .put('/api/contacts/999')
        .send(updateData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 400 status for invalid id format', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .put('/api/contacts/invalid')
        .send(updateData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 status for invalid contact data', async () => {
      const invalidData = {
        firstName: 'John',
        // lastName missing
        email: 'invalid-email',
      };

      const response = await request(app)
        .put('/api/contacts/1')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 status on service error', async () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      contactService.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/contacts/1')
        .send(validData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete contact and return 204 status', async () => {
      contactService.remove.mockResolvedValue();

      const response = await request(app).delete('/api/contacts/1');

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(contactService.remove).toHaveBeenCalledWith(1);
    });

    it('should return 404 status when contact not found', async () => {
      const notFoundError = new Error('Contact not found');
      notFoundError.statusCode = 404;
      contactService.remove.mockRejectedValue(notFoundError);

      const response = await request(app).delete('/api/contacts/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Contact not found');
    });

    it('should return 400 status for invalid id format', async () => {
      const response = await request(app).delete('/api/contacts/invalid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 status on service error', async () => {
      contactService.remove.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete('/api/contacts/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response Format Tests', () => {
    it('should return JSON content type for all responses', async () => {
      contactService.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/contacts');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include proper error structure in error responses', async () => {
      const invalidData = {
        firstName: 'John',
        // lastName missing
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidData)
        .set('Content-Type', 'application/json');

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should include all required contact fields in success response', async () => {
      const mockContact = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-555-0123',
        company: 'Acme Corp',
        notes: 'Test',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      contactService.findById.mockResolvedValue(mockContact);

      const response = await request(app).get('/api/contacts/1');

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('firstName');
      expect(response.body).toHaveProperty('lastName');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('company');
      expect(response.body).toHaveProperty('notes');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});

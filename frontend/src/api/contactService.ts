import apiClient from './config';

/**
 * Contact interface matching the backend response format
 */
export interface Contact {
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

/**
 * Contact data for creating or updating (without id and timestamps)
 */
export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

/**
 * Get all contacts
 * @returns Promise resolving to array of contacts
 * @throws ApiError if request fails
 */
export async function getAllContacts(): Promise<Contact[]> {
  const response = await apiClient.get<Contact[]>('/api/contacts');
  return response.data;
}

/**
 * Get a single contact by ID
 * @param id - Contact ID
 * @returns Promise resolving to contact
 * @throws ApiError if request fails or contact not found
 */
export async function getContactById(id: number): Promise<Contact> {
  const response = await apiClient.get<Contact>(`/api/contacts/${id}`);
  return response.data;
}

/**
 * Create a new contact
 * @param data - Contact data
 * @returns Promise resolving to created contact
 * @throws ApiError if request fails or validation fails
 */
export async function createContact(data: ContactInput): Promise<Contact> {
  const response = await apiClient.post<Contact>('/api/contacts', data);
  return response.data;
}

/**
 * Update an existing contact
 * @param id - Contact ID
 * @param data - Updated contact data
 * @returns Promise resolving to updated contact
 * @throws ApiError if request fails, validation fails, or contact not found
 */
export async function updateContact(id: number, data: ContactInput): Promise<Contact> {
  const response = await apiClient.put<Contact>(`/api/contacts/${id}`, data);
  return response.data;
}

/**
 * Delete a contact
 * @param id - Contact ID
 * @returns Promise resolving when deletion is complete
 * @throws ApiError if request fails or contact not found
 */
export async function deleteContact(id: number): Promise<void> {
  await apiClient.delete(`/api/contacts/${id}`);
}

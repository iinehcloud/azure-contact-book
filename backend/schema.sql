-- Contact Book Database Schema
-- PostgreSQL 14+

-- Drop table if exists (for clean migrations)
DROP TABLE IF EXISTS contacts CASCADE;

-- Create contacts table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for frequently queried fields
CREATE INDEX idx_contacts_last_name ON contacts(last_name);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any UPDATE
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Stores contact information for the contact book application';
COMMENT ON COLUMN contacts.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN contacts.first_name IS 'Contact first name (required, max 50 chars)';
COMMENT ON COLUMN contacts.last_name IS 'Contact last name (required, max 50 chars)';
COMMENT ON COLUMN contacts.email IS 'Contact email address (optional, max 100 chars)';
COMMENT ON COLUMN contacts.phone IS 'Contact phone number (optional, max 20 chars)';
COMMENT ON COLUMN contacts.company IS 'Contact company name (optional, max 100 chars)';
COMMENT ON COLUMN contacts.notes IS 'Additional notes about the contact (optional)';
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when contact was created';
COMMENT ON COLUMN contacts.updated_at IS 'Timestamp when contact was last updated (auto-updated by trigger)';

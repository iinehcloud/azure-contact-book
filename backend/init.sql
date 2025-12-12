-- Contact Book Database Initialization Script
-- PostgreSQL 14+
-- This script initializes the database schema and optionally loads sample data

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================

-- Drop table if exists (for clean initialization)
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

-- ============================================================================
-- SAMPLE DATA (Optional - for testing purposes)
-- ============================================================================
-- Uncomment the following section to load sample data for testing

/*
INSERT INTO contacts (first_name, last_name, email, phone, company, notes) VALUES
    ('John', 'Doe', 'john.doe@example.com', '+1-555-0123', 'Acme Corp', 'Met at tech conference 2024'),
    ('Jane', 'Smith', 'jane.smith@techstart.io', '+1-555-0124', 'TechStart Inc', 'Potential business partner'),
    ('Michael', 'Johnson', 'mjohnson@email.com', '+1-555-0125', 'Johnson & Associates', 'Legal consultant'),
    ('Emily', 'Brown', 'emily.brown@design.co', '+1-555-0126', 'Creative Design Co', 'UI/UX designer for project'),
    ('David', 'Wilson', 'david.w@consulting.com', '+1-555-0127', 'Wilson Consulting', 'Business strategy advisor'),
    ('Sarah', 'Martinez', 'sarah.m@marketing.net', '+1-555-0128', 'Digital Marketing Pro', 'Marketing campaign manager'),
    ('Robert', 'Taylor', 'rtaylor@finance.com', '+1-555-0129', 'Taylor Financial', 'Financial advisor'),
    ('Lisa', 'Anderson', 'lisa.anderson@hr.com', '+1-555-0130', 'HR Solutions Ltd', 'Recruitment specialist'),
    ('James', 'Thomas', 'james.thomas@dev.io', '+1-555-0131', 'DevOps Masters', 'Cloud infrastructure expert'),
    ('Jennifer', 'Garcia', 'jennifer.g@sales.com', '+1-555-0132', 'Sales Excellence', 'Sales training coordinator');
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the database setup

-- Check table structure
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'contacts'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'contacts';

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'contacts';

-- Count contacts (should be 0 without sample data, 10 with sample data)
-- SELECT COUNT(*) as total_contacts FROM contacts;

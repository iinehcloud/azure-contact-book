# Contact Book Backend API

Backend REST API for the Azure Contact Book application built with Node.js and Express.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Testing**: Jest, Supertest

## Environment Variables

The following environment variables are required for the application to run:

### Server Configuration

- `PORT` - Port number for the server (default: 3000)
- `NODE_ENV` - Environment mode (`development`, `production`, or `test`)

### Database Configuration

- `DATABASE_URL` - PostgreSQL connection string in the format:
  ```
  postgresql://username:password@host:port/database
  ```

### CORS Configuration

- `CORS_ORIGIN` - Allowed origin for CORS requests (e.g., `https://your-frontend.azurestaticapps.net`)

### Example Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

## Local Development Setup

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Initialize the database:
   ```bash
   # Connect to PostgreSQL and run the schema
   psql -U your_username -d contactbook -f schema.sql
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at `http://localhost:3000`

## Database Setup

### Prerequisites

- PostgreSQL 14 or higher installed and running
- PostgreSQL client tools (psql) installed
- Database user with CREATE DATABASE privileges

### Quick Setup (Local Development)

The easiest way to initialize the database is using the `init.sql` script:

```bash
# Method 1: Using psql command line
psql -U postgres -f init.sql

# Method 2: Interactive psql session
psql -U postgres
\i init.sql
\q
```

This will:
1. Create the `contacts` table with all required fields
2. Set up indexes for optimized queries
3. Create triggers for automatic timestamp updates
4. Optionally load sample data (if uncommented in the script)

### Step-by-Step Setup

If you prefer manual setup or need more control:

#### 1. Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE contactbook;

# Exit psql
\q
```

#### 2. Initialize Schema

```bash
# Run the initialization script
psql -U postgres -d contactbook -f init.sql
```

Or run the schema file directly:

```bash
psql -U postgres -d contactbook -f schema.sql
```

#### 3. Verify Setup

```bash
# Connect to the database
psql -U postgres -d contactbook

# Check table structure
\d contacts

# Check indexes
\di

# Check triggers
\dS update_contacts_updated_at

# Exit
\q
```

### Database Schema

The database schema is defined in `schema.sql` and `init.sql` and includes:

#### Tables

**contacts** - Stores contact information
- `id` - SERIAL PRIMARY KEY (auto-incrementing)
- `first_name` - VARCHAR(50) NOT NULL
- `last_name` - VARCHAR(50) NOT NULL
- `email` - VARCHAR(100) (optional)
- `phone` - VARCHAR(20) (optional)
- `company` - VARCHAR(100) (optional)
- `notes` - TEXT (optional)
- `created_at` - TIMESTAMP (auto-set on creation)
- `updated_at` - TIMESTAMP (auto-updated on modification)

#### Indexes

- `idx_contacts_last_name` - Index on `last_name` for faster searches
- `idx_contacts_email` - Index on `email` for faster lookups

#### Triggers

- `update_contacts_updated_at` - Automatically updates `updated_at` timestamp on any UPDATE operation

### Sample Data (Optional)

The `init.sql` file includes commented sample data for testing. To load sample data:

1. Open `init.sql` in a text editor
2. Uncomment the INSERT statements in the "SAMPLE DATA" section
3. Run the script:
   ```bash
   psql -U postgres -d contactbook -f init.sql
   ```

This will populate the database with 10 sample contacts for testing purposes.

### Azure Database for PostgreSQL Setup

For production deployment on Azure:

#### 1. Create Azure Database for PostgreSQL

```bash
# Using Azure CLI
az postgres flexible-server create \
  --resource-group <resource-group> \
  --name <server-name> \
  --location <location> \
  --admin-user <admin-username> \
  --admin-password <admin-password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14
```

#### 2. Configure Firewall Rules

```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group <resource-group> \
  --name <server-name> \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your local IP (for setup)
az postgres flexible-server firewall-rule create \
  --resource-group <resource-group> \
  --name <server-name> \
  --rule-name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

#### 3. Create Database

```bash
# Connect to Azure PostgreSQL
psql "host=<server-name>.postgres.database.azure.com port=5432 dbname=postgres user=<admin-username> password=<admin-password> sslmode=require"

# Create database
CREATE DATABASE contactbook;

# Exit
\q
```

#### 4. Initialize Schema

```bash
# Run initialization script on Azure database
psql "host=<server-name>.postgres.database.azure.com port=5432 dbname=contactbook user=<admin-username> password=<admin-password> sslmode=require" -f init.sql
```

#### 5. Get Connection String

```bash
# Format for DATABASE_URL environment variable
postgresql://<admin-username>:<admin-password>@<server-name>.postgres.database.azure.com:5432/contactbook?sslmode=require
```

Add this connection string to your Azure App Service Application Settings as `DATABASE_URL`.

### Database Migrations

For schema changes after initial setup:

1. Create a new migration SQL file (e.g., `migrations/001_add_field.sql`)
2. Test the migration on a development database
3. Apply to production during a maintenance window
4. Update `schema.sql` and `init.sql` to reflect the current schema

### Troubleshooting

#### Connection Issues

```bash
# Test database connection
psql -U postgres -d contactbook -c "SELECT version();"

# Check if database exists
psql -U postgres -c "\l" | grep contactbook

# Check if table exists
psql -U postgres -d contactbook -c "\dt"
```

#### Permission Issues

```bash
# Grant necessary permissions
psql -U postgres -d contactbook

GRANT ALL PRIVILEGES ON DATABASE contactbook TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### Reset Database

```bash
# Drop and recreate (WARNING: destroys all data)
psql -U postgres -c "DROP DATABASE IF EXISTS contactbook;"
psql -U postgres -c "CREATE DATABASE contactbook;"
psql -U postgres -d contactbook -f init.sql
```

### Backup and Restore

#### Backup

```bash
# Backup entire database
pg_dump -U postgres contactbook > backup.sql

# Backup only schema
pg_dump -U postgres --schema-only contactbook > schema_backup.sql

# Backup only data
pg_dump -U postgres --data-only contactbook > data_backup.sql
```

#### Restore

```bash
# Restore from backup
psql -U postgres -d contactbook -f backup.sql
```

## API Endpoints

### Base URL

- Local: `http://localhost:3000`
- Production: `https://your-api.azurewebsites.net`

### Endpoints

#### Get All Contacts

```
GET /api/contacts
```

**Response**: 200 OK

```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "company": "Acme Corp",
    "notes": "Met at conference",
    "createdAt": "2025-12-07T10:30:00Z",
    "updatedAt": "2025-12-07T10:30:00Z"
  }
]
```

#### Get Contact by ID

```
GET /api/contacts/:id
```

**Parameters**:
- `id` (path) - Contact ID (positive integer)

**Response**: 200 OK

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "notes": "Met at conference",
  "createdAt": "2025-12-07T10:30:00Z",
  "updatedAt": "2025-12-07T10:30:00Z"
}
```

**Error Responses**:
- 400 Bad Request - Invalid ID format
- 404 Not Found - Contact not found

#### Create Contact

```
POST /api/contacts
```

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "notes": "Met at conference"
}
```

**Validation Rules**:
- `firstName` - Required, 1-50 characters
- `lastName` - Required, 1-50 characters
- `email` - Optional, valid email format
- `phone` - Optional, valid phone format
- `company` - Optional, max 100 characters
- `notes` - Optional, max 500 characters

**Response**: 201 Created

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "notes": "Met at conference",
  "createdAt": "2025-12-07T10:30:00Z",
  "updatedAt": "2025-12-07T10:30:00Z"
}
```

**Error Responses**:
- 400 Bad Request - Validation failed

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### Update Contact

```
PUT /api/contacts/:id
```

**Parameters**:
- `id` (path) - Contact ID (positive integer)

**Request Body**: Same as Create Contact

**Response**: 200 OK

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.updated@example.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "notes": "Met at conference",
  "createdAt": "2025-12-07T10:30:00Z",
  "updatedAt": "2025-12-07T15:45:00Z"
}
```

**Error Responses**:
- 400 Bad Request - Invalid ID or validation failed
- 404 Not Found - Contact not found

#### Delete Contact

```
DELETE /api/contacts/:id
```

**Parameters**:
- `id` (path) - Contact ID (positive integer)

**Response**: 204 No Content

**Error Responses**:
- 400 Bad Request - Invalid ID format
- 404 Not Found - Contact not found

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/
│   └── contactController.js # Request handlers
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Request validation
├── repositories/
│   └── contactRepository.js # Data access layer
├── routes/
│   └── contacts.js          # Route definitions
├── services/
│   └── contactService.js    # Business logic layer
├── schema.sql               # Database schema
├── server.js                # Application entry point
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variable template
```

## Deployment to Azure

### Azure App Service Configuration

1. Create an Azure App Service with Node.js runtime
2. Configure Application Settings with environment variables:
   - `PORT` (automatically set by Azure)
   - `DATABASE_URL` (connection string to Azure PostgreSQL)
   - `NODE_ENV=production`
   - `CORS_ORIGIN` (URL of your Static Web App)

3. Deploy using one of these methods:
   - GitHub Actions (recommended)
   - Azure CLI
   - VS Code Azure extension
   - Local Git deployment

### Database Connection

Ensure your Azure Database for PostgreSQL:
- Has firewall rules configured to allow App Service access
- Uses SSL connections (enforced by default)
- Connection string is stored in App Service configuration

### Health Check

The server includes a basic health check at the root endpoint:

```
GET /
```

Response: `Contact Book API is running`

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Validation error or invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

All error responses include a JSON body with error details.

## Security Considerations

- All database queries use parameterized statements to prevent SQL injection
- CORS is configured to only allow requests from the specified origin
- Environment variables are used for all sensitive configuration
- Input validation is performed on all endpoints
- SSL/TLS is enforced in production (Azure handles this automatically)

## Support

For issues or questions, please refer to the main project README or create an issue in the repository.

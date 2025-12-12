const { Pool } = require('pg');

// Load connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Health check function to verify database connectivity
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
async function checkConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

/**
 * Execute a query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error getting client from pool:', error.message);
    throw error;
  }
}

/**
 * Initialize database connection and verify connectivity
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Close database connection (alias for closePool)
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  return closePool();
}

/**
 * Gracefully close the connection pool
 * @returns {Promise<void>}
 */
async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  checkConnection,
  closePool,
  initializeDatabase,
  closeDatabase,
};

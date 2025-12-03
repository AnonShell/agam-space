-- Initialize Agam Space PostgreSQL Database
-- This script runs when the database is first created

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a dedicated schema for our application (optional, but good practice)
-- CREATE SCHEMA IF NOT EXISTS agam_space;

-- Set default search path (optional)
-- ALTER DATABASE agam_space SET search_path TO agam_space, public;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Agam Space database initialized successfully';
END $$; 
-- Execute all necessary database migrations for the ambulance supply system

-- First, create the basic tables (locations, storage units, etc.)
\i scripts/001_create_basic_tables.sql

-- Then create the locations schema
\i scripts/002_create_locations_schema.sql

-- Create the inventory schema (this includes inventory_items table)
\i scripts/003_create_inventory_schema.sql

-- Create views and functions
\i scripts/004_create_views_and_functions.sql

-- Add any additional migrations as needed
\i scripts/012_create_hierarchical_inventory.sql

-- Temporarily disable RLS on storage_unit_types table to allow admin operations
-- This is a workaround for JWT claims not being available in the default setup

-- Disable RLS on storage_unit_types table
ALTER TABLE public.storage_unit_types DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
COMMENT ON TABLE public.storage_unit_types IS 'RLS temporarily disabled to allow admin operations. Organization filtering handled at application level.';

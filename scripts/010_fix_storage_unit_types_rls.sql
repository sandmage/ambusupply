-- Fix RLS policies for storage_unit_types table to prevent policy violations

-- Drop existing problematic policies
DROP POLICY IF EXISTS "storage_unit_types_select" ON public.storage_unit_types;
DROP POLICY IF EXISTS "storage_unit_types_insert" ON public.storage_unit_types;
DROP POLICY IF EXISTS "storage_unit_types_update" ON public.storage_unit_types;
DROP POLICY IF EXISTS "storage_unit_types_delete" ON public.storage_unit_types;

-- Create simplified RLS policies that work with JWT claims
CREATE POLICY "storage_unit_types_select" ON public.storage_unit_types
  FOR SELECT USING (
    organization_id::text = (auth.jwt() ->> 'organization_id')
  );

CREATE POLICY "storage_unit_types_insert" ON public.storage_unit_types
  FOR INSERT WITH CHECK (
    organization_id::text = (auth.jwt() ->> 'organization_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "storage_unit_types_update" ON public.storage_unit_types
  FOR UPDATE USING (
    organization_id::text = (auth.jwt() ->> 'organization_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "storage_unit_types_delete" ON public.storage_unit_types
  FOR DELETE USING (
    organization_id::text = (auth.jwt() ->> 'organization_id')
    AND (auth.jwt() ->> 'role') = 'admin'
  );

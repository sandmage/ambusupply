-- Create storage unit types table for managing different types of storage units
CREATE TABLE IF NOT EXISTS storage_unit_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    capacity_type text NOT NULL CHECK (capacity_type IN ('volume', 'weight', 'count', 'custom')),
    default_capacity integer,
    description text,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(name, organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_unit_types_org ON storage_unit_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_storage_unit_types_name ON storage_unit_types(name);

-- Enable RLS
ALTER TABLE storage_unit_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view storage unit types in their organization" ON storage_unit_types
    FOR SELECT USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Admins can insert storage unit types" ON storage_unit_types
    FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid AND
        (auth.jwt() ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can update storage unit types" ON storage_unit_types
    FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid AND
        (auth.jwt() ->> 'role') = 'admin'
    );

CREATE POLICY "Admins can delete storage unit types" ON storage_unit_types
    FOR DELETE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid AND
        (auth.jwt() ->> 'role') = 'admin'
    );

-- Insert some default storage unit types
INSERT INTO storage_unit_types (name, capacity_type, default_capacity, description, organization_id)
SELECT 
    'Cabinet', 'count', 50, 'Standard medical cabinet for supplies', id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO storage_unit_types (name, capacity_type, default_capacity, description, organization_id)
SELECT 
    'Drawer', 'count', 25, 'Drawer unit for smaller medical items', id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO storage_unit_types (name, capacity_type, default_capacity, description, organization_id)
SELECT 
    'Refrigerator', 'volume', 100, 'Temperature-controlled storage for medications', id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO storage_unit_types (name, capacity_type, default_capacity, description, organization_id)
SELECT 
    'Shelf', 'count', 30, 'Open shelf storage for easy access items', id
FROM organizations
ON CONFLICT (name, organization_id) DO NOTHING;

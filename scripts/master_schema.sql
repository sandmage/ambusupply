-- Master Database Schema for Ambulance Supply System
-- This script creates all necessary tables and types safely
-- Uses IF NOT EXISTS to avoid conflicts with existing schema

-- Create custom enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('available', 'on_duty', 'off_duty', 'unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'out_of_service', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_type AS ENUM ('routine', 'repair', 'inspection', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizations table first (referenced by many others)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type text DEFAULT 'hospital'::text CHECK (organization_type = ANY (ARRAY['hospital'::text, 'clinic'::text, 'ems'::text, 'fire_department'::text, 'other'::text])),
  address text,
  phone text,
  email text,
  license_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- Create profiles table (referenced by many others)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  role user_role DEFAULT 'staff'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  setup_completed boolean DEFAULT false,
  invited_at timestamp with time zone,
  invitation_accepted_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  location_type text DEFAULT 'room'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parent_location_id uuid,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_parent_location_id_fkey FOREIGN KEY (parent_location_id) REFERENCES public.locations(id)
);

-- Create storage_unit_types table
CREATE TABLE IF NOT EXISTS public.storage_unit_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity_type text NOT NULL CHECK (capacity_type = ANY (ARRAY['volume'::text, 'weight'::text, 'count'::text, 'custom'::text])),
  default_capacity integer,
  description text,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT storage_unit_types_pkey PRIMARY KEY (id),
  CONSTRAINT storage_unit_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create storage_units table
CREATE TABLE IF NOT EXISTS public.storage_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid,
  name text NOT NULL,
  unit_type text NOT NULL,
  parent_unit_id uuid,
  position_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT storage_units_pkey PRIMARY KEY (id),
  CONSTRAINT storage_units_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT storage_units_parent_unit_id_fkey FOREIGN KEY (parent_unit_id) REFERENCES public.storage_units(id)
);

-- Create inventory_items table (CRITICAL - this is what our API needs)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  current_quantity integer DEFAULT 0,
  par_level integer DEFAULT 0,
  unit_of_measure text DEFAULT 'each'::text,
  expiration_date date,
  lot_number text,
  location_id uuid,
  storage_unit_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ordering_url text CHECK (ordering_url IS NULL OR ordering_url ~ '^https?://.*'::text),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT inventory_items_storage_unit_id_fkey FOREIGN KEY (storage_unit_id) REFERENCES public.storage_units(id)
);

-- Create transactions table for inventory tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['use'::text, 'restock'::text, 'adjustment'::text, 'expired'::text])),
  quantity_change integer NOT NULL,
  reason text,
  performed_by text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id)
);

-- Create inventory_allocations table for hierarchical inventory
CREATE TABLE IF NOT EXISTS public.inventory_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_item_id uuid NOT NULL,
  child_location_id uuid NOT NULL,
  child_storage_unit_id uuid,
  allocated_quantity integer NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  current_quantity integer NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  name text NOT NULL,
  description text,
  unit_of_measure text NOT NULL DEFAULT 'each'::text,
  par_level integer NOT NULL DEFAULT 0,
  expiration_date date,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_allocations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT inventory_allocations_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT inventory_allocations_child_location_id_fkey FOREIGN KEY (child_location_id) REFERENCES public.locations(id),
  CONSTRAINT inventory_allocations_child_storage_unit_id_fkey FOREIGN KEY (child_storage_unit_id) REFERENCES public.storage_units(id)
);

-- Create allocation_transactions table
CREATE TABLE IF NOT EXISTS public.allocation_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['allocate'::text, 'deallocate'::text, 'transfer'::text, 'use'::text, 'restock'::text])),
  quantity_change integer NOT NULL,
  quantity_after integer NOT NULL,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT allocation_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT allocation_transactions_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.inventory_allocations(id),
  CONSTRAINT allocation_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff'::text CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text])),
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  accepted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles(id),
  CONSTRAINT invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL UNIQUE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  vin text NOT NULL UNIQUE,
  license_plate text NOT NULL UNIQUE,
  vehicle_type text DEFAULT 'ambulance'::text,
  status vehicle_status DEFAULT 'active'::vehicle_status,
  mileage integer DEFAULT 0,
  fuel_capacity numeric DEFAULT 0,
  current_location jsonb,
  last_location_update timestamp with time zone,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  registration_expiration date,
  insurance_expiration date,
  insurance_provider character varying,
  insurance_policy_number character varying,
  dot_inspection_date date,
  dot_inspection_expiration date,
  dot_number character varying,
  oems_inspection_date date,
  oems_inspection_expiration date,
  oems_certification_number character varying,
  annual_inspection_date date,
  annual_inspection_expiration date,
  emissions_test_date date,
  emissions_test_expiration date,
  medical_equipment_certification date,
  medical_equipment_cert_expiration date,
  radio_license_expiration date,
  narcotics_license_expiration date,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  license_number text NOT NULL UNIQUE,
  license_expiry date NOT NULL,
  certifications jsonb,
  status driver_status DEFAULT 'available'::driver_status,
  hire_date date NOT NULL,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drivers_pkey PRIMARY KEY (id),
  CONSTRAINT drivers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create remaining vehicle-related tables
CREATE TABLE IF NOT EXISTS public.vehicle_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  driver_id uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  unassigned_at timestamp with time zone,
  shift_start timestamp with time zone,
  shift_end timestamp with time zone,
  notes text,
  assigned_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT vehicle_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id),
  CONSTRAINT vehicle_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);

CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  inspector_id uuid,
  inspection_date date NOT NULL,
  inspection_type text NOT NULL,
  checklist_items jsonb NOT NULL,
  overall_status text CHECK (overall_status = ANY (ARRAY['pass'::text, 'fail'::text, 'conditional'::text])),
  issues_found text[],
  recommendations text,
  next_inspection_due date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_inspections_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.profiles(id),
  CONSTRAINT vehicle_inspections_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);

CREATE TABLE IF NOT EXISTS public.vehicle_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text,
  speed numeric,
  heading integer,
  recorded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_locations_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_locations_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);

CREATE TABLE IF NOT EXISTS public.fuel_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  driver_id uuid,
  fuel_amount numeric NOT NULL,
  cost_per_gallon numeric,
  total_cost numeric,
  odometer_reading integer,
  fuel_station text,
  receipt_number text,
  fueled_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fuel_records_pkey PRIMARY KEY (id),
  CONSTRAINT fuel_records_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id),
  CONSTRAINT fuel_records_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  maintenance_type maintenance_type NOT NULL,
  description text NOT NULL,
  scheduled_date date,
  completed_date date,
  mileage_at_service integer,
  cost numeric,
  service_provider text,
  parts_replaced jsonb,
  next_service_due date,
  notes text,
  performed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_records_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_records_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id),
  CONSTRAINT maintenance_records_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON public.inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiration ON public.inventory_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);

-- Enable Row Level Security on key tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (can be customized later)
DO $$ BEGIN
    CREATE POLICY "Users can view inventory items" ON public.inventory_items
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert inventory items" ON public.inventory_items
      FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update inventory items" ON public.inventory_items
      FOR UPDATE USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Success message
SELECT 'Master database schema created successfully!' as result;

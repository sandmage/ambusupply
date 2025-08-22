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

-- Adding equipment management system tables
-- Create equipment status enum
DO $$ BEGIN
    CREATE TYPE equipment_status AS ENUM ('in_service', 'out_of_service', 'maintenance', 'retired', 'assigned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create equipment types table
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category = ANY (ARRAY['airway'::text, 'cardiac'::text, 'monitoring'::text, 'transport'::text, 'suction'::text, 'ventilation'::text, 'other'::text])),
  manufacturer text,
  model text,
  specifications jsonb,
  maintenance_interval_days integer DEFAULT 365,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_types_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_type_id uuid NOT NULL,
  serial_number text NOT NULL UNIQUE,
  asset_tag text,
  purchase_date date,
  purchase_cost numeric,
  warranty_expiration date,
  status equipment_status DEFAULT 'in_service'::equipment_status,
  location_id uuid,
  assigned_vehicle_id uuid,
  last_maintenance_date date,
  next_maintenance_due date,
  notes text,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id),
  CONSTRAINT equipment_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT equipment_assigned_vehicle_id_fkey FOREIGN KEY (assigned_vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT equipment_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create equipment maintenance records table
CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type = ANY (ARRAY['routine'::text, 'repair'::text, 'inspection'::text, 'calibration'::text, 'emergency'::text])),
  description text NOT NULL,
  scheduled_date date,
  completed_date date,
  cost numeric,
  service_provider text,
  parts_replaced jsonb,
  next_service_due date,
  maintenance_notes text,
  performed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_maintenance_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_maintenance_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id),
  CONSTRAINT equipment_maintenance_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id)
);

-- Create equipment assignments history table
CREATE TABLE IF NOT EXISTS public.equipment_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  vehicle_id uuid,
  location_id uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  unassigned_at timestamp with time zone,
  assigned_by uuid,
  assignment_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_assignments_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id),
  CONSTRAINT equipment_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT equipment_assignments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT equipment_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
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

-- Create indexes for equipment tables
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON public.equipment(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_vehicle ON public.equipment(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON public.equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON public.equipment_maintenance(completed_date);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_equipment ON public.equipment_assignments(equipment_id);

-- Enable Row Level Security on key tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on equipment tables
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for equipment tables
DO $$ BEGIN
    CREATE POLICY "Users can view equipment" ON public.equipment
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert equipment" ON public.equipment
      FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view equipment types" ON public.equipment_types
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default equipment types for common medical equipment
INSERT INTO public.equipment_types (name, description, category, manufacturer, model, maintenance_interval_days) VALUES
  ('Stretcher', 'Patient transport stretcher', 'transport', 'Stryker', 'Power-PRO XT', 365),
  ('Lucas Device', 'Mechanical chest compression device', 'cardiac', 'Stryker', 'LUCAS 3', 180),
  ('Suction Unit', 'Portable suction device', 'suction', 'Laerdal', 'LSU 4000', 90),
  ('McGrath Laryngoscope', 'Video laryngoscope', 'airway', 'Medtronic', 'McGrath MAC', 180),
  ('Z-Vent', 'Portable ventilator', 'ventilation', 'ZOLL', 'Z Vent', 90),
  ('Monitor/Defibrillator', 'Cardiac monitor and defibrillator', 'cardiac', 'ZOLL', 'X Series', 365),
  ('Pulse Oximeter', 'Oxygen saturation monitor', 'monitoring', 'Masimo', 'Rad-97', 365),
  ('Blood Pressure Monitor', 'Automated blood pressure cuff', 'monitoring', 'Welch Allyn', 'Connex VSM', 365),
  ('Backboard', 'Spinal immobilization board', 'transport', 'Ferno', 'Najo Lite', 365),
  ('Stair Chair', 'Patient transport chair', 'transport', 'Ferno', 'Model 42', 365)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Master database schema created successfully!' as result;

-- Vehicle Storage Hierarchy System
-- This enables precise inventory tracking within vehicles down to specific pockets/shelves

-- Create vehicle storage units table (cabinets, bags, equipment containers)
CREATE TABLE IF NOT EXISTS public.vehicle_storage_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  name text NOT NULL, -- e.g., "ALS Bag", "Cabinet 3", "Airway Kit"
  unit_type text NOT NULL CHECK (unit_type = ANY (ARRAY['cabinet'::text, 'bag'::text, 'kit'::text, 'compartment'::text, 'drawer'::text, 'other'::text])),
  description text,
  position_info jsonb, -- {"side": "left", "level": "upper", "bay": "1"}
  capacity_info jsonb, -- {"max_weight": 50, "max_volume": 100}
  is_removable boolean DEFAULT false, -- can this unit be removed from vehicle?
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_storage_units_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_storage_units_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_storage_units_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create vehicle storage locations table (sub-locations within storage units)
CREATE TABLE IF NOT EXISTS public.vehicle_storage_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  storage_unit_id uuid NOT NULL,
  name text NOT NULL, -- e.g., "Front Flap Pocket", "Shelf B", "Module 2", "Left Pouch"
  location_type text NOT NULL CHECK (location_type = ANY (ARRAY['pocket'::text, 'pouch'::text, 'shelf'::text, 'module'::text, 'compartment'::text, 'slot'::text, 'hook'::text, 'other'::text])),
  description text,
  position_info jsonb, -- {"row": 2, "column": 1, "depth": "front"}
  capacity_info jsonb, -- {"max_items": 10, "max_weight": 5}
  access_notes text, -- "Velcro closure", "Zipper pocket", "Magnetic latch"
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_storage_locations_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_storage_locations_storage_unit_id_fkey FOREIGN KEY (storage_unit_id) REFERENCES public.vehicle_storage_units(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_storage_locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create vehicle inventory items table (inventory assigned to specific vehicle locations)
CREATE TABLE IF NOT EXISTS public.vehicle_inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL, -- references main inventory_items table
  storage_unit_id uuid, -- can be assigned to storage unit level
  storage_location_id uuid, -- or to specific location within unit
  current_quantity integer NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  par_level_min integer NOT NULL DEFAULT 0 CHECK (par_level_min >= 0),
  par_level_max integer, -- optional maximum level
  expiration_date date, -- specific expiration for this vehicle's stock
  lot_number text, -- specific lot for this vehicle's stock
  notes text, -- location-specific notes
  last_checked_at timestamp with time zone,
  last_checked_by uuid,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_inventory_items_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_inventory_items_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT vehicle_inventory_items_storage_unit_id_fkey FOREIGN KEY (storage_unit_id) REFERENCES public.vehicle_storage_units(id) ON DELETE SET NULL,
  CONSTRAINT vehicle_inventory_items_storage_location_id_fkey FOREIGN KEY (storage_location_id) REFERENCES public.vehicle_storage_locations(id) ON DELETE SET NULL,
  CONSTRAINT vehicle_inventory_items_last_checked_by_fkey FOREIGN KEY (last_checked_by) REFERENCES public.profiles(id),
  CONSTRAINT vehicle_inventory_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  -- Ensure item is assigned to either storage unit or specific location, not both
  CONSTRAINT vehicle_inventory_items_location_check CHECK (
    (storage_unit_id IS NOT NULL AND storage_location_id IS NULL) OR
    (storage_unit_id IS NULL AND storage_location_id IS NOT NULL)
  )
);

-- Create vehicle inventory transactions table (track movements and usage)
CREATE TABLE IF NOT EXISTS public.vehicle_inventory_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_inventory_item_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['restock'::text, 'use'::text, 'transfer'::text, 'adjustment'::text, 'expired'::text, 'check'::text])),
  quantity_change integer NOT NULL, -- positive for additions, negative for usage
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  reason text,
  notes text,
  performed_by uuid NOT NULL,
  performed_at timestamp with time zone DEFAULT now(),
  shift_id uuid, -- optional reference to shift/assignment
  call_id uuid, -- optional reference to specific call/incident
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_inventory_transactions_vehicle_inventory_item_id_fkey FOREIGN KEY (vehicle_inventory_item_id) REFERENCES public.vehicle_inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_inventory_transactions_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id),
  CONSTRAINT vehicle_inventory_transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create vehicle inventory compliance table (track par level compliance)
CREATE TABLE IF NOT EXISTS public.vehicle_inventory_compliance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  check_date date NOT NULL,
  checked_by uuid NOT NULL,
  total_items_checked integer NOT NULL DEFAULT 0,
  items_below_par integer NOT NULL DEFAULT 0,
  items_expired integer NOT NULL DEFAULT 0,
  items_missing integer NOT NULL DEFAULT 0,
  overall_compliance_score numeric(5,2), -- percentage 0-100
  compliance_status text NOT NULL CHECK (compliance_status = ANY (ARRAY['compliant'::text, 'non_compliant'::text, 'needs_attention'::text])),
  notes text,
  next_check_due date,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_inventory_compliance_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_inventory_compliance_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_inventory_compliance_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES public.profiles(id),
  CONSTRAINT vehicle_inventory_compliance_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create indexes for vehicle storage hierarchy tables
CREATE INDEX IF NOT EXISTS idx_vehicle_storage_units_vehicle ON public.vehicle_storage_units(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_storage_units_type ON public.vehicle_storage_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_storage_locations_storage_unit ON public.vehicle_storage_locations(storage_unit_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_storage_locations_type ON public.vehicle_storage_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_items_vehicle ON public.vehicle_inventory_items(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_items_inventory_item ON public.vehicle_inventory_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_items_storage_unit ON public.vehicle_inventory_items(storage_unit_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_items_storage_location ON public.vehicle_inventory_items(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_items_par_level ON public.vehicle_inventory_items(par_level_min);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_transactions_item ON public.vehicle_inventory_transactions(vehicle_inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_transactions_date ON public.vehicle_inventory_transactions(performed_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_compliance_vehicle ON public.vehicle_inventory_compliance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inventory_compliance_date ON public.vehicle_inventory_compliance(check_date);

-- Enable Row Level Security on vehicle storage tables
ALTER TABLE public.vehicle_storage_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inventory_compliance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicle storage tables
DO $$ BEGIN
    CREATE POLICY "Users can view vehicle storage units" ON public.vehicle_storage_units
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage vehicle storage units" ON public.vehicle_storage_units
      FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view vehicle storage locations" ON public.vehicle_storage_locations
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage vehicle storage locations" ON public.vehicle_storage_locations
      FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view vehicle inventory items" ON public.vehicle_inventory_items
      FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage vehicle inventory items" ON public.vehicle_inventory_items
      FOR ALL USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert sample vehicle storage units for common ambulance configurations
INSERT INTO public.vehicle_storage_units (vehicle_id, name, unit_type, description, position_info) 
SELECT 
  v.id,
  storage_data.name,
  storage_data.unit_type::text,
  storage_data.description,
  storage_data.position_info::jsonb
FROM public.vehicles v
CROSS JOIN (VALUES
  ('ALS Bag', 'bag', 'Advanced Life Support medication and equipment bag', '{"location": "main_compartment", "side": "left"}'),
  ('BLS Bag', 'bag', 'Basic Life Support equipment bag', '{"location": "main_compartment", "side": "right"}'),
  ('Airway Kit', 'kit', 'Intubation and airway management kit', '{"location": "main_compartment", "position": "center"}'),
  ('Cabinet 1', 'cabinet', 'Upper left cabinet', '{"bay": "patient_compartment", "side": "left", "level": "upper"}'),
  ('Cabinet 2', 'cabinet', 'Upper right cabinet', '{"bay": "patient_compartment", "side": "right", "level": "upper"}'),
  ('Cabinet 3', 'cabinet', 'Lower left cabinet', '{"bay": "patient_compartment", "side": "left", "level": "lower"}'),
  ('Cabinet 4', 'cabinet', 'Lower right cabinet', '{"bay": "patient_compartment", "side": "right", "level": "lower"}'),
  ('Trauma Kit', 'kit', 'Trauma supplies and bandaging materials', '{"location": "main_compartment", "accessibility": "quick_access"}'),
  ('Drug Box', 'compartment', 'Secured medication compartment', '{"location": "main_compartment", "security": "locked"}'),
  ('O2 Compartment', 'compartment', 'Oxygen tank and delivery equipment', '{"location": "main_compartment", "side": "rear"}')
) AS storage_data(name, unit_type, description, position_info)
WHERE v.vehicle_type = 'ambulance'
ON CONFLICT DO NOTHING;

-- Success message for vehicle storage hierarchy
SELECT 'Vehicle storage hierarchy schema added successfully!' as result;

-- Removed daily check forms section since it's now in a separate sub-script
-- Daily check forms are now managed in scripts/016_daily_check_forms.sql

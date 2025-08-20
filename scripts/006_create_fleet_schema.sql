-- Fleet Management Schema for Ambulance Supply System
-- This script creates all necessary tables for comprehensive fleet management

-- Create vehicle status enum
DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'out_of_service', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create driver status enum
DO $$ BEGIN
    CREATE TYPE driver_status AS ENUM ('available', 'assigned', 'off_duty', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create maintenance type enum
DO $$ BEGIN
    CREATE TYPE maintenance_type AS ENUM ('routine', 'repair', 'inspection', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  vehicle_type TEXT DEFAULT 'ambulance',
  status vehicle_status DEFAULT 'active',
  mileage INTEGER DEFAULT 0,
  fuel_capacity DECIMAL(8,2) DEFAULT 0,
  current_location JSONB, -- {lat, lng, address}
  last_location_update TIMESTAMP WITH TIME ZONE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  certifications JSONB, -- Array of certification objects
  status driver_status DEFAULT 'available',
  hire_date DATE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_assignments table
CREATE TABLE IF NOT EXISTS public.vehicle_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  shift_start TIMESTAMP WITH TIME ZONE,
  shift_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  mileage_at_service INTEGER,
  cost DECIMAL(10,2),
  service_provider TEXT,
  parts_replaced JSONB, -- Array of parts
  next_service_due DATE,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_records table
CREATE TABLE IF NOT EXISTS public.fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  fuel_amount DECIMAL(8,2) NOT NULL,
  cost_per_gallon DECIMAL(6,3),
  total_cost DECIMAL(10,2),
  odometer_reading INTEGER,
  fuel_station TEXT,
  receipt_number TEXT,
  fueled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_inspections table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES public.profiles(id),
  inspection_date DATE NOT NULL,
  inspection_type TEXT NOT NULL,
  checklist_items JSONB NOT NULL, -- Array of inspection items with pass/fail
  overall_status TEXT CHECK (overall_status IN ('pass', 'fail', 'conditional')),
  issues_found TEXT[],
  recommendations TEXT,
  next_inspection_due DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS public.vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT,
  speed DECIMAL(5,2),
  heading INTEGER, -- 0-360 degrees
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all fleet tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fleet management
CREATE POLICY "organization_vehicles" ON public.vehicles 
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "organization_drivers" ON public.drivers 
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "organization_assignments" ON public.vehicle_assignments 
  FOR ALL USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "organization_maintenance" ON public.maintenance_records 
  FOR ALL USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "organization_fuel" ON public.fuel_records 
  FOR ALL USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "organization_inspections" ON public.vehicle_inspections 
  FOR ALL USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "organization_locations" ON public.vehicle_locations 
  FOR ALL USING (vehicle_id IN (
    SELECT id FROM public.vehicles WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_organization ON public.drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ON public.vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver ON public.vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON public.fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON public.vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_locations_vehicle ON public.vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_locations_recorded_at ON public.vehicle_locations(recorded_at);

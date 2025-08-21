-- Replace psql include commands with actual SQL statements
-- Create user roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (simplified version)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location_type TEXT DEFAULT 'room',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage_units table
CREATE TABLE IF NOT EXISTS public.storage_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  parent_unit_id UUID REFERENCES public.storage_units(id) ON DELETE CASCADE,
  position_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory items table with proper schema
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_par_level INTEGER NOT NULL DEFAULT 0,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  expiration_date DATE,
  notes TEXT,
  
  -- Location tracking
  location_id UUID NOT NULL REFERENCES public.locations(id),
  storage_unit_id UUID REFERENCES public.storage_units(id),
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity >= 0),
  CONSTRAINT positive_par_level CHECK (min_par_level >= 0)
);

-- Create inventory transactions table for tracking usage/restocking
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'use', 'restock', 'adjustment', 'expired'
  quantity_change INTEGER NOT NULL, -- positive for restock, negative for use
  quantity_after INTEGER NOT NULL,
  notes TEXT,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('use', 'restock', 'adjustment', 'expired'))
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now)
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_locations" ON public.locations;
CREATE POLICY "allow_all_locations" ON public.locations FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_storage_units" ON public.storage_units;
CREATE POLICY "allow_all_storage_units" ON public.storage_units FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_inventory_items" ON public.inventory_items;
CREATE POLICY "allow_all_inventory_items" ON public.inventory_items FOR ALL USING (true);

DROP POLICY IF EXISTS "allow_all_inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "allow_all_inventory_transactions" ON public.inventory_transactions FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_location_id ON public.inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_storage_unit_id ON public.inventory_items(storage_unit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON public.inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

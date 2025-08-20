-- Create user roles enum
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'staff');

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

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  current_quantity INTEGER DEFAULT 0,
  par_level INTEGER DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'each',
  expiration_date DATE,
  lot_number TEXT,
  location_id UUID REFERENCES public.locations(id),
  storage_unit_id UUID REFERENCES public.storage_units(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('use', 'restock', 'adjustment', 'expired')),
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now)
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "allow_all_locations" ON public.locations FOR ALL USING (true);
CREATE POLICY "allow_all_storage_units" ON public.storage_units FOR ALL USING (true);
CREATE POLICY "allow_all_inventory_items" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "allow_all_transactions" ON public.transactions FOR ALL USING (true);

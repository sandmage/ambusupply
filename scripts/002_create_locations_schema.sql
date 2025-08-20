-- Create locations table for top-level physical locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage units table for nested storage within locations
CREATE TABLE IF NOT EXISTS public.storage_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  parent_unit_id UUID REFERENCES public.storage_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'rack', 'shelf', 'cabinet', 'drawer', 'container'
  position_order INTEGER DEFAULT 0,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no circular references
  CONSTRAINT no_self_reference CHECK (id != parent_unit_id)
);

-- Enable RLS on locations and storage_units
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for locations (all authenticated users can read, admin can modify)
CREATE POLICY "locations_select_authenticated" ON public.locations 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "locations_admin_all" ON public.locations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for storage_units (same as locations)
CREATE POLICY "storage_units_select_authenticated" ON public.storage_units 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "storage_units_admin_all" ON public.storage_units 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_storage_units_location_id ON public.storage_units(location_id);
CREATE INDEX idx_storage_units_parent_unit_id ON public.storage_units(parent_unit_id);

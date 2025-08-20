-- Create hierarchical inventory allocation system

-- Add parent_location_id to locations table for location hierarchy
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS parent_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE;

-- Create inventory allocations table to track parent-child inventory relationships
CREATE TABLE IF NOT EXISTS public.inventory_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent inventory item (source)
  parent_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  
  -- Child location where inventory is allocated
  child_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  child_storage_unit_id UUID REFERENCES public.storage_units(id) ON DELETE SET NULL,
  
  -- Allocation details
  allocated_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  
  -- Item details for the allocated inventory
  name TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  par_level INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE,
  notes TEXT,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_allocated_quantity CHECK (allocated_quantity >= 0),
  CONSTRAINT positive_current_quantity CHECK (current_quantity >= 0),
  CONSTRAINT current_not_exceed_allocated CHECK (current_quantity <= allocated_quantity),
  CONSTRAINT unique_allocation_per_location UNIQUE (parent_item_id, child_location_id, child_storage_unit_id)
);

-- Create allocation transactions table for tracking allocation movements
CREATE TABLE IF NOT EXISTS public.allocation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES public.inventory_allocations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'allocate', 'deallocate', 'transfer', 'use', 'restock'
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  notes TEXT,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_allocation_transaction_type CHECK (
    transaction_type IN ('allocate', 'deallocate', 'transfer', 'use', 'restock')
  )
);

-- Enable RLS on new tables
ALTER TABLE public.inventory_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_allocations
CREATE POLICY "inventory_allocations_select_authenticated" ON public.inventory_allocations 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_allocations_admin_all" ON public.inventory_allocations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for allocation_transactions
CREATE POLICY "allocation_transactions_select_authenticated" ON public.allocation_transactions 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "allocation_transactions_admin_all" ON public.allocation_transactions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_locations_parent_location_id ON public.locations(parent_location_id);
CREATE INDEX idx_inventory_allocations_parent_item_id ON public.inventory_allocations(parent_item_id);
CREATE INDEX idx_inventory_allocations_child_location_id ON public.inventory_allocations(child_location_id);
CREATE INDEX idx_allocation_transactions_allocation_id ON public.allocation_transactions(allocation_id);

-- Create function to update allocation quantity after transaction
CREATE OR REPLACE FUNCTION update_allocation_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_allocations 
  SET 
    current_quantity = NEW.quantity_after,
    updated_at = NOW()
  WHERE id = NEW.allocation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update allocation quantity
CREATE TRIGGER update_allocation_after_transaction
  AFTER INSERT ON public.allocation_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_allocation_quantity();

-- Create view for hierarchical inventory overview
CREATE OR REPLACE VIEW public.hierarchical_inventory_overview AS
SELECT 
  i.id as parent_item_id,
  i.name as parent_item_name,
  i.current_quantity as parent_quantity,
  l.name as parent_location_name,
  l.id as parent_location_id,
  
  -- Aggregated allocation data
  COALESCE(SUM(a.allocated_quantity), 0) as total_allocated,
  COALESCE(SUM(a.current_quantity), 0) as total_current_allocated,
  (i.current_quantity - COALESCE(SUM(a.allocated_quantity), 0)) as available_for_allocation,
  
  -- Child location details
  array_agg(
    CASE WHEN a.id IS NOT NULL THEN
      json_build_object(
        'allocation_id', a.id,
        'child_location_id', cl.id,
        'child_location_name', cl.name,
        'allocated_quantity', a.allocated_quantity,
        'current_quantity', a.current_quantity,
        'par_level', a.par_level
      )
    END
  ) FILTER (WHERE a.id IS NOT NULL) as allocations

FROM public.inventory_items i
JOIN public.locations l ON i.location_id = l.id
LEFT JOIN public.inventory_allocations a ON i.id = a.parent_item_id
LEFT JOIN public.locations cl ON a.child_location_id = cl.id
GROUP BY i.id, i.name, i.current_quantity, l.name, l.id;

-- Create function to allocate inventory to child location
CREATE OR REPLACE FUNCTION allocate_inventory(
  p_parent_item_id UUID,
  p_child_location_id UUID,
  p_quantity INTEGER,
  p_child_storage_unit_id UUID DEFAULT NULL,
  p_par_level INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_allocation_id UUID;
  v_parent_item RECORD;
  v_available_quantity INTEGER;
BEGIN
  -- Get parent item details
  SELECT * INTO v_parent_item
  FROM public.inventory_items
  WHERE id = p_parent_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent item not found';
  END IF;
  
  -- Calculate available quantity for allocation
  SELECT (v_parent_item.current_quantity - COALESCE(SUM(allocated_quantity), 0))
  INTO v_available_quantity
  FROM public.inventory_allocations
  WHERE parent_item_id = p_parent_item_id;
  
  IF v_available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient quantity available for allocation. Available: %, Requested: %', 
      v_available_quantity, p_quantity;
  END IF;
  
  -- Create or update allocation
  INSERT INTO public.inventory_allocations (
    parent_item_id,
    child_location_id,
    child_storage_unit_id,
    allocated_quantity,
    current_quantity,
    name,
    description,
    unit_of_measure,
    par_level,
    expiration_date,
    notes,
    created_by
  ) VALUES (
    p_parent_item_id,
    p_child_location_id,
    p_child_storage_unit_id,
    p_quantity,
    p_quantity, -- Initially, current_quantity equals allocated_quantity
    v_parent_item.name,
    v_parent_item.description,
    v_parent_item.unit_of_measure,
    p_par_level,
    v_parent_item.expiration_date,
    p_notes,
    auth.uid()
  )
  ON CONFLICT (parent_item_id, child_location_id, child_storage_unit_id)
  DO UPDATE SET
    allocated_quantity = inventory_allocations.allocated_quantity + p_quantity,
    current_quantity = inventory_allocations.current_quantity + p_quantity,
    updated_at = NOW()
  RETURNING id INTO v_allocation_id;
  
  -- Record allocation transaction
  INSERT INTO public.allocation_transactions (
    allocation_id,
    transaction_type,
    quantity_change,
    quantity_after,
    notes,
    created_by
  ) VALUES (
    v_allocation_id,
    'allocate',
    p_quantity,
    (SELECT current_quantity FROM public.inventory_allocations WHERE id = v_allocation_id),
    p_notes,
    auth.uid()
  );
  
  RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- Create inventory items table
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

-- Enable RLS on inventory tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_items (all authenticated users can read, admin can modify)
CREATE POLICY "inventory_items_select_authenticated" ON public.inventory_items 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "inventory_items_admin_all" ON public.inventory_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff can create usage transactions
CREATE POLICY "inventory_transactions_staff_use" ON public.inventory_transactions 
  FOR INSERT WITH CHECK (
    transaction_type = 'use' AND 
    auth.role() = 'authenticated'
  );

-- All authenticated users can read transactions
CREATE POLICY "inventory_transactions_select_authenticated" ON public.inventory_transactions 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can do all transaction types
CREATE POLICY "inventory_transactions_admin_all" ON public.inventory_transactions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_location_id ON public.inventory_items(location_id);
CREATE INDEX idx_inventory_items_storage_unit_id ON public.inventory_items(storage_unit_id);
CREATE INDEX idx_inventory_items_name ON public.inventory_items(name);
CREATE INDEX idx_inventory_transactions_item_id ON public.inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

-- Create function to update inventory quantity after transaction
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.inventory_items 
  SET 
    quantity = NEW.quantity_after,
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inventory quantity
CREATE TRIGGER update_inventory_after_transaction
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();

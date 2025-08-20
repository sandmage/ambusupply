-- Create view for items below par level
CREATE OR REPLACE VIEW public.items_below_par AS
SELECT 
  i.*,
  l.name as location_name,
  su.name as storage_unit_name,
  (i.min_par_level - i.quantity) as shortage_amount
FROM public.inventory_items i
JOIN public.locations l ON i.location_id = l.id
LEFT JOIN public.storage_units su ON i.storage_unit_id = su.id
WHERE i.quantity < i.min_par_level;

-- Create view for expiring items (within 30 days)
CREATE OR REPLACE VIEW public.expiring_items AS
SELECT 
  i.*,
  l.name as location_name,
  su.name as storage_unit_name,
  (i.expiration_date - CURRENT_DATE) as days_until_expiration
FROM public.inventory_items i
JOIN public.locations l ON i.location_id = l.id
LEFT JOIN public.storage_units su ON i.storage_unit_id = su.id
WHERE i.expiration_date IS NOT NULL 
  AND i.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY i.expiration_date ASC;

-- Create function to get full storage path for an item
CREATE OR REPLACE FUNCTION get_storage_path(item_id UUID)
RETURNS TEXT AS $$
DECLARE
  path_parts TEXT[];
  current_unit_id UUID;
  unit_name TEXT;
  location_name TEXT;
BEGIN
  -- Get the item's location and storage unit
  SELECT l.name, i.storage_unit_id
  INTO location_name, current_unit_id
  FROM public.inventory_items i
  JOIN public.locations l ON i.location_id = l.id
  WHERE i.id = item_id;
  
  -- Start with location name
  path_parts := ARRAY[location_name];
  
  -- Build path by traversing up the storage unit hierarchy
  WHILE current_unit_id IS NOT NULL LOOP
    SELECT name, parent_unit_id
    INTO unit_name, current_unit_id
    FROM public.storage_units
    WHERE id = current_unit_id;
    
    IF unit_name IS NOT NULL THEN
      path_parts := path_parts || unit_name;
    END IF;
  END LOOP;
  
  -- Return the path as a string
  RETURN array_to_string(path_parts, ' > ');
END;
$$ LANGUAGE plpgsql;

-- Create function for usage trends (last 30 days)
CREATE OR REPLACE FUNCTION get_usage_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  total_used INTEGER,
  avg_daily_usage NUMERIC,
  location_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    COALESCE(SUM(ABS(t.quantity_change)), 0)::INTEGER as total_used,
    COALESCE(SUM(ABS(t.quantity_change))::NUMERIC / days_back, 0) as avg_daily_usage,
    l.name as location_name
  FROM public.inventory_items i
  JOIN public.locations l ON i.location_id = l.id
  LEFT JOIN public.inventory_transactions t ON i.id = t.item_id 
    AND t.transaction_type = 'use'
    AND t.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY i.id, i.name, l.name
  ORDER BY total_used DESC;
END;
$$ LANGUAGE plpgsql;

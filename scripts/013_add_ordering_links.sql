-- Add ordering_url column to inventory_items table for admin re-ordering links
ALTER TABLE public.inventory_items 
ADD COLUMN ordering_url TEXT;

-- Add constraint to validate URL format (optional but recommended)
ALTER TABLE public.inventory_items 
ADD CONSTRAINT valid_ordering_url 
CHECK (ordering_url IS NULL OR ordering_url ~ '^https?://.*');

-- Add comment for documentation
COMMENT ON COLUMN public.inventory_items.ordering_url IS 'URL link for easy re-ordering of this inventory item';

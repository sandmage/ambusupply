-- Add ordering_url column to inventory_items table for admin re-ordering links
-- Added IF NOT EXISTS check to prevent duplicate column errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_items' 
        AND column_name = 'ordering_url'
    ) THEN
        ALTER TABLE public.inventory_items 
        ADD COLUMN ordering_url TEXT;
        
        -- Add constraint to validate URL format (optional but recommended)
        ALTER TABLE public.inventory_items 
        ADD CONSTRAINT valid_ordering_url 
        CHECK (ordering_url IS NULL OR ordering_url ~ '^https?://.*');
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.inventory_items.ordering_url IS 'URL link for easy re-ordering of this inventory item';
    END IF;
END $$;

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_type TEXT DEFAULT 'hospital' CHECK (organization_type IN ('hospital', 'clinic', 'ems', 'fire_department', 'other')),
  address TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add setup_completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for organizations
CREATE POLICY "allow_all_organizations" ON public.organizations FOR ALL USING (true);

-- Update existing profiles to have setup_completed = true (for existing users)
UPDATE public.profiles SET setup_completed = true WHERE setup_completed IS NULL;

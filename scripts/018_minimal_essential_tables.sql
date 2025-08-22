-- Create essential tables for user management without complex RLS policies
-- This avoids infinite recursion issues while providing basic functionality

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but with simple policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Simple policies that avoid recursion
-- Allow all authenticated users to read profiles (temporary for debugging)
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to read organizations (temporary)
DROP POLICY IF EXISTS "Allow authenticated users to read organizations" ON public.organizations;
CREATE POLICY "Allow authenticated users to read organizations" ON public.organizations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to read invitations (temporary)
DROP POLICY IF EXISTS "Allow authenticated users to read invitations" ON public.invitations;
CREATE POLICY "Allow authenticated users to read invitations" ON public.invitations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);

-- Create a default organization for testing
INSERT INTO public.organizations (name) 
VALUES ('Default Organization') 
ON CONFLICT DO NOTHING;

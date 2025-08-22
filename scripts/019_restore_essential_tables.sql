-- Restore essential tables for user management system
-- Based on the complete schema that was working previously

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization_type text DEFAULT 'hospital'::text CHECK (organization_type = ANY (ARRAY['hospital'::text, 'clinic'::text, 'ems'::text, 'fire_department'::text, 'other'::text])),
  address text,
  phone text,
  email text,
  license_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- Create user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  role user_role DEFAULT 'staff'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  setup_completed boolean DEFAULT false,
  invited_at timestamp with time zone,
  invitation_accepted_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff'::text CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text])),
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  accepted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles(id),
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id),
  CONSTRAINT invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies that avoid recursion
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Allow authenticated users to view organizations" ON public.organizations;
CREATE POLICY "Allow authenticated users to view organizations" ON public.organizations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to view invitations" ON public.invitations;
CREATE POLICY "Allow authenticated users to view invitations" ON public.invitations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert invitations" ON public.invitations;
CREATE POLICY "Allow authenticated users to insert invitations" ON public.invitations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update invitations" ON public.invitations;
CREATE POLICY "Allow authenticated users to update invitations" ON public.invitations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create essential tables for invitation system to work
-- This script creates the minimum required tables for invitations to function

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

-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
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
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id),
  CONSTRAINT invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles(id),
  CONSTRAINT invitations_invitation_token_unique UNIQUE (invitation_token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Removed IF NOT EXISTS from CREATE POLICY statements for PostgreSQL compatibility
-- Create basic RLS policies for organizations
CREATE POLICY "Users can view their own organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create basic RLS policies for profiles
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Create basic RLS policies for invitations
CREATE POLICY "Users can view invitations for their organization" ON public.invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update invitations they created" ON public.invitations
  FOR UPDATE USING (invited_by = auth.uid());

-- Insert a default organization if none exists
INSERT INTO public.organizations (name, organization_type, email)
SELECT 'Default Organization', 'hospital', 'admin@example.com'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations);

COMMENT ON TABLE public.organizations IS 'Organizations (hospitals, clinics, EMS services, etc.)';
COMMENT ON TABLE public.profiles IS 'User profiles with organization association';
COMMENT ON TABLE public.invitations IS 'Invitation system for adding users to organizations';

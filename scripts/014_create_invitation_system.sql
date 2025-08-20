-- Create invitation system for multi-user organizations
-- This allows admin users to invite others to join their organization

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique pending invitations per email per organization
    UNIQUE(organization_id, email, accepted_at) DEFERRABLE INITIALLY DEFERRED
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Use CREATE OR REPLACE POLICY to avoid conflicts with existing policies
-- RLS Policies for invitations
CREATE OR REPLACE POLICY "Users can view invitations for their organization" ON public.invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE OR REPLACE POLICY "Admins can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE OR REPLACE POLICY "Admins can update invitations" ON public.invitations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE OR REPLACE POLICY "Admins can delete invitations" ON public.invitations
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
    p_invitation_token UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_invitation RECORD;
    v_organization_id UUID;
    v_role TEXT;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE invitation_token = p_invitation_token
    AND expires_at > NOW()
    AND accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update user profile with organization
    UPDATE public.profiles
    SET 
        organization_id = v_invitation.organization_id,
        role = v_invitation.role,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Mark invitation as accepted
    UPDATE public.invitations
    SET 
        accepted_at = NOW(),
        accepted_by = p_user_id,
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.invitations
    WHERE expires_at < NOW() AND accepted_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add invitation tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE;

-- Update existing profiles to mark them as original users (not invited)
UPDATE public.profiles 
SET invited_at = created_at, invitation_accepted_at = created_at
WHERE invited_at IS NULL;

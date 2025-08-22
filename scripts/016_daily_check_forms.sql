-- Daily Check Forms System
-- Creates tables for customizable vehicle daily inspection forms

-- Daily Check Forms table - stores customizable form templates
CREATE TABLE IF NOT EXISTS daily_check_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID, -- Made optional since organizations table may not exist
    form_name TEXT NOT NULL,
    description TEXT,
    vehicle_types TEXT[] DEFAULT '{}',
    checklist_items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID -- Removed foreign key constraint to auth.users
);

-- Daily Check Submissions table - records completed daily checks
CREATE TABLE IF NOT EXISTS daily_check_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID, -- Made optional
    form_id UUID NOT NULL REFERENCES daily_check_forms(id) ON DELETE CASCADE,
    vehicle_id UUID, -- Removed foreign key constraint to vehicles table
    submitted_by UUID, -- Removed foreign key constraint to auth.users
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responses JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'issues_found', 'incomplete')),
    overall_condition TEXT CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT,
    signature_data TEXT, -- Base64 encoded signature
    photos JSONB DEFAULT '[]', -- Array of photo URLs/metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Check Issues table - tracks specific issues found during inspections
CREATE TABLE IF NOT EXISTS daily_check_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID, -- Made optional
    submission_id UUID NOT NULL REFERENCES daily_check_submissions(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- References the checklist item that failed
    issue_description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'deferred')),
    assigned_to UUID, -- Removed foreign key constraint to auth.users
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_check_forms_org ON daily_check_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_forms_active ON daily_check_forms(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_org ON daily_check_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_vehicle ON daily_check_submissions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_date ON daily_check_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_status ON daily_check_submissions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_org ON daily_check_issues(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_submission ON daily_check_issues(submission_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_status ON daily_check_issues(organization_id, status);

-- Row Level Security Policies (simplified)
ALTER TABLE daily_check_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_issues ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policies that don't depend on custom functions
CREATE POLICY "Allow all operations on daily_check_forms" ON daily_check_forms FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_check_submissions" ON daily_check_submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_check_issues" ON daily_check_issues FOR ALL USING (true);

-- Sample form template without dependencies on other tables
INSERT INTO daily_check_forms (form_name, description, vehicle_types, checklist_items)
VALUES (
    'Standard Ambulance Daily Check',
    'Comprehensive daily inspection checklist for ambulance vehicles',
    ARRAY['ambulance', 'rescue', 'support'],
    '[
        {
            "id": "exterior_lights",
            "label": "All exterior lights functioning",
            "type": "checkbox",
            "category": "safety",
            "required": true
        },
        {
            "id": "emergency_equipment",
            "label": "Emergency equipment present and functional",
            "type": "checkbox",
            "category": "equipment",
            "required": true
        },
        {
            "id": "medical_supplies",
            "label": "Medical supplies stocked and within expiration",
            "type": "checkbox",
            "category": "inventory",
            "required": true
        },
        {
            "id": "fuel_level",
            "label": "Fuel level",
            "type": "select",
            "category": "maintenance",
            "required": true,
            "options": ["Full", "3/4", "1/2", "1/4", "Low"]
        },
        {
            "id": "mileage",
            "label": "Current mileage",
            "type": "number",
            "category": "maintenance",
            "required": true
        },
        {
            "id": "issues_notes",
            "label": "Additional notes or issues",
            "type": "textarea",
            "category": "maintenance",
            "required": false
        }
    ]'::jsonb
)
ON CONFLICT DO NOTHING;

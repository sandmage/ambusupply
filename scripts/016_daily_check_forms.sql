-- Simplified script to remove all complex features that might prevent execution
-- Daily Check Forms System - Minimal Version
-- Creates basic tables for vehicle daily inspection forms

-- Daily Check Forms table
CREATE TABLE IF NOT EXISTS daily_check_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_name TEXT NOT NULL,
    description TEXT,
    vehicle_types TEXT[] DEFAULT '{}',
    checklist_items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Check Submissions table
CREATE TABLE IF NOT EXISTS daily_check_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES daily_check_forms(id) ON DELETE CASCADE,
    vehicle_id TEXT, -- Simple text field instead of UUID reference
    submitted_by TEXT, -- Simple text field for user identification
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responses JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'completed',
    overall_condition TEXT,
    notes TEXT,
    signature_data TEXT,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Check Issues table
CREATE TABLE IF NOT EXISTS daily_check_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES daily_check_submissions(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_date ON daily_check_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_vehicle ON daily_check_submissions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_submission ON daily_check_issues(submission_id);

-- Sample form template
INSERT INTO daily_check_forms (form_name, description, vehicle_types, checklist_items)
VALUES (
    'Standard Ambulance Daily Check',
    'Basic daily inspection checklist for ambulance vehicles',
    ARRAY['ambulance'],
    '[
        {
            "id": "exterior_lights",
            "label": "All exterior lights functioning",
            "type": "checkbox",
            "category": "safety",
            "required": true
        },
        {
            "id": "medical_supplies",
            "label": "Medical supplies stocked",
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
        }
    ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Daily Check Forms Schema for Vehicle Inspection System
-- This script creates tables for customizable daily vehicle check forms

-- Create daily_check_forms table
CREATE TABLE IF NOT EXISTS public.daily_check_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  vehicle_types TEXT[] DEFAULT '{}', -- Array of vehicle types this form applies to
  checklist_items JSONB NOT NULL DEFAULT '[]', -- Array of checklist item objects
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_check_submissions table
CREATE TABLE IF NOT EXISTS public.daily_check_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.daily_check_forms(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.profiles(id),
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_start_time TIME,
  shift_end_time TIME,
  pre_trip_mileage INTEGER,
  post_trip_mileage INTEGER,
  checklist_responses JSONB NOT NULL DEFAULT '{}', -- Responses to checklist items
  issues_found TEXT[],
  overall_status TEXT CHECK (overall_status IN ('pass', 'fail', 'conditional')) DEFAULT 'pass',
  notes TEXT,
  signature_data TEXT, -- Base64 encoded signature for mobile app
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_check_issues table for tracking specific issues found
CREATE TABLE IF NOT EXISTS public.daily_check_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.daily_check_submissions(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL, -- References the item ID from the form
  issue_type TEXT NOT NULL, -- 'fail', 'defect', 'missing', 'damaged'
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  photo_urls TEXT[], -- Array of photo URLs for documentation
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all daily check tables
ALTER TABLE public.daily_check_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_issues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily check forms
CREATE POLICY "organization_daily_check_forms" ON public.daily_check_forms 
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "organization_daily_check_submissions" ON public.daily_check_submissions 
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "organization_daily_check_issues" ON public.daily_check_issues 
  FOR ALL USING (submission_id IN (
    SELECT id FROM public.daily_check_submissions WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_check_forms_organization ON public.daily_check_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_forms_active ON public.daily_check_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_form ON public.daily_check_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_vehicle ON public.daily_check_submissions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_date ON public.daily_check_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_daily_check_submissions_organization ON public.daily_check_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_submission ON public.daily_check_issues(submission_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_issues_resolved ON public.daily_check_issues(resolved);

-- Insert sample daily check form
INSERT INTO public.daily_check_forms (
  name,
  description,
  vehicle_types,
  checklist_items,
  is_active
) VALUES (
  'Standard Ambulance Daily Check',
  'Comprehensive daily inspection checklist for ambulance vehicles',
  ARRAY['ambulance'],
  '[
    {
      "id": "engine_oil",
      "type": "checkbox",
      "label": "Check engine oil level",
      "description": "Verify oil level is between min/max marks",
      "required": true,
      "category": "maintenance",
      "order": 1
    },
    {
      "id": "tire_pressure",
      "type": "checkbox", 
      "label": "Check tire pressure and condition",
      "description": "Inspect all tires for proper pressure and wear",
      "required": true,
      "category": "safety",
      "order": 2
    },
    {
      "id": "oxygen_tank",
      "type": "number",
      "label": "Oxygen tank pressure (PSI)",
      "description": "Record main oxygen tank pressure",
      "required": true,
      "category": "equipment",
      "order": 3
    },
    {
      "id": "defibrillator",
      "type": "checkbox",
      "label": "Test defibrillator functionality",
      "description": "Perform daily self-test on AED/monitor",
      "required": true,
      "category": "equipment",
      "order": 4
    },
    {
      "id": "medication_check",
      "type": "select",
      "label": "Medication inventory status",
      "description": "Verify all medications are present and not expired",
      "required": true,
      "category": "inventory",
      "options": ["Complete", "Missing items", "Expired items", "Needs restocking"],
      "order": 5
    }
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

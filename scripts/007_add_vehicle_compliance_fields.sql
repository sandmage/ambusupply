-- Add compliance and certification tracking fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oems_inspection_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oems_inspection_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oems_certification_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS annual_inspection_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS annual_inspection_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS emissions_test_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS emissions_test_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS medical_equipment_certification DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS medical_equipment_cert_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS radio_license_expiration DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS narcotics_license_expiration DATE;

-- Add indexes for expiration date queries
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_expiration ON vehicles(registration_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_expiration ON vehicles(insurance_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_dot_inspection_expiration ON vehicles(dot_inspection_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_oems_inspection_expiration ON vehicles(oems_inspection_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_annual_inspection_expiration ON vehicles(annual_inspection_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_emissions_test_expiration ON vehicles(emissions_test_expiration);
CREATE INDEX IF NOT EXISTS idx_vehicles_medical_equipment_cert_expiration ON vehicles(medical_equipment_cert_expiration);

-- Create view for vehicles with upcoming expirations (within 30 days)
CREATE OR REPLACE VIEW vehicles_expiring_soon AS
SELECT 
  v.*,
  CASE 
    WHEN registration_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'registration'
    WHEN insurance_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'insurance'
    WHEN dot_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'dot_inspection'
    WHEN oems_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'oems_inspection'
    WHEN annual_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'annual_inspection'
    WHEN emissions_test_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'emissions_test'
    WHEN medical_equipment_cert_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'medical_equipment'
    WHEN radio_license_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'radio_license'
    WHEN narcotics_license_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'narcotics_license'
  END as expiring_type,
  CASE 
    WHEN registration_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN registration_expiration
    WHEN insurance_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN insurance_expiration
    WHEN dot_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN dot_inspection_expiration
    WHEN oems_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN oems_inspection_expiration
    WHEN annual_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN annual_inspection_expiration
    WHEN emissions_test_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN emissions_test_expiration
    WHEN medical_equipment_cert_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN medical_equipment_cert_expiration
    WHEN radio_license_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN radio_license_expiration
    WHEN narcotics_license_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN narcotics_license_expiration
  END as expiration_date
FROM vehicles v
WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
  AND (
    registration_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    insurance_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    dot_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    oems_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    annual_inspection_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    emissions_test_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    medical_equipment_cert_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    radio_license_expiration <= CURRENT_DATE + INTERVAL '30 days' OR
    narcotics_license_expiration <= CURRENT_DATE + INTERVAL '30 days'
  );

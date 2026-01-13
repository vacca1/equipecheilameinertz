-- Add health plan authorization fields to patient_packages
ALTER TABLE patient_packages 
ADD COLUMN IF NOT EXISTS authorization_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS authorization_date DATE,
ADD COLUMN IF NOT EXISTS health_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_health_plan_authorization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS therapist VARCHAR(100);

-- Add index for faster lookups by authorization code
CREATE INDEX IF NOT EXISTS idx_patient_packages_authorization_code ON patient_packages(authorization_code);

-- Add index for health plan authorizations
CREATE INDEX IF NOT EXISTS idx_patient_packages_health_plan ON patient_packages(is_health_plan_authorization) WHERE is_health_plan_authorization = true;
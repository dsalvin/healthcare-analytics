-- migrations/003_create_medical_staff.sql
CREATE TABLE medical_staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    license_number VARCHAR(255),
    years_of_experience INTEGER,
    certifications TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Update trigger for medical_staff
CREATE TRIGGER update_medical_staff_updated_at
    BEFORE UPDATE ON medical_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
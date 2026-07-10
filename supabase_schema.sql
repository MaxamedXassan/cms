-- =======================================================
--  CLINIC MANAGEMENT SYSTEM - SUPABASE SQL SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor
-- =======================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admins Profile Table
-- This links to Supabase auth.users
CREATE TABLE admins (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Visits Table
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    complaint TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Finance Table
CREATE TABLE finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    consult_fee DECIMAL(10,2) DEFAULT 0,
    med_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) GENERATED ALWAYS AS (consult_fee + med_cost) STORED,
    paid DECIMAL(10,2) DEFAULT 0,
    remaining DECIMAL(10,2) GENERATED ALWAYS AS ((consult_fee + med_cost) - paid) STORED,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Settings Table (Singleton)
CREATE TABLE settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    clinic_name TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT '$',
    default_consult_fee DECIMAL(10,2) DEFAULT 50
);

-- Insert default settings row
INSERT INTO settings (id, clinic_name, logo_url, currency, default_consult_fee)
VALUES (1, 'Apex Care Clinic', '', '$', 50.00)
ON CONFLICT (id) DO NOTHING;

-- 7. SECURITY: Row Level Security (RLS)
-- Enable RLS for all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows AUTHENTICATED users to perform all actions
CREATE POLICY "Allow authenticated access" ON admins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON finance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Performance Indexes
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_finance_visit_id ON finance(visit_id);

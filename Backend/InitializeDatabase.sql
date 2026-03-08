-- InitializeDatabase.sql
-- Run this script to initialize the database schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email) WHERE deleted_at IS NULL
);

-- Create ECG Sessions table
CREATE TABLE IF NOT EXISTS ecg_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    classification TEXT NOT NULL,
    average_heart_rate INT,
    samples JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes for ECG Sessions
CREATE INDEX IF NOT EXISTS idx_ecg_tenant_user_time
ON ecg_sessions(tenant_id, user_id, recorded_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ecg_user_id
ON ecg_sessions(user_id)
WHERE deleted_at IS NULL;

-- Create Blood Pressure Readings table
CREATE TABLE IF NOT EXISTS blood_pressure_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    pulse INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Create indexes for Blood Pressure Readings
CREATE INDEX IF NOT EXISTS idx_bp_tenant_user_time
ON blood_pressure_readings(tenant_id, user_id, recorded_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bp_user_id
ON blood_pressure_readings(user_id)
WHERE deleted_at IS NULL;

-- Create indexes for general queries
CREATE INDEX IF NOT EXISTS idx_users_tenant_id
ON users(tenant_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ecg_created_at
ON ecg_sessions(created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bp_created_at
ON blood_pressure_readings(created_at DESC)
WHERE deleted_at IS NULL;

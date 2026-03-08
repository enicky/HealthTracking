CREATE TABLE IF NOT EXISTS "Tenants" (
    "Id" UUID PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "CreatedAt" TIMESTAMPTZ DEFAULT now(),
    "UpdatedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY,
    "TenantId" UUID NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "Email" TEXT NOT NULL,
    "CreatedAt" TIMESTAMPTZ DEFAULT now(),
    "UpdatedAt" TIMESTAMPTZ,
    "DeletedAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_TenantId_Email" 
ON "Users"("TenantId", "Email") WHERE "DeletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "EcgSessions" (
    "Id" UUID PRIMARY KEY,
    "TenantId" UUID NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "RecordedAt" TIMESTAMPTZ NOT NULL,
    "Classification" TEXT NOT NULL,
    "AverageHeartRate" INT,
    "Samples" JSONB NOT NULL,
    "CreatedAt" TIMESTAMPTZ DEFAULT now(),
    "DeletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_ecg_tenant_user_time"
ON "EcgSessions"("TenantId", "UserId", "RecordedAt" DESC)
WHERE "DeletedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "BloodPressureReadings" (
    "Id" UUID PRIMARY KEY,
    "TenantId" UUID NOT NULL REFERENCES "Tenants"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "RecordedAt" TIMESTAMPTZ NOT NULL,
    "Systolic" INT NOT NULL,
    "Diastolic" INT NOT NULL,
    "Pulse" INT,
    "CreatedAt" TIMESTAMPTZ DEFAULT now(),
    "DeletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_bp_tenant_user_time"
ON "BloodPressureReadings"("TenantId", "UserId", "RecordedAt" DESC)
WHERE "DeletedAt" IS NULL;

-- Insert test data
INSERT INTO "Tenants" ("Id", "Name") VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Tenant')
ON CONFLICT DO NOTHING;

INSERT INTO "Users" ("Id", "TenantId", "Email") VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'test@example.com')
ON CONFLICT DO NOTHING;

-- seed-test-data.sql
-- Insert test data for local development

-- Insert test tenant
INSERT INTO public."Tenants" ("Id", "Name", "CreatedAt")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Test Tenant',
  now()
)
ON CONFLICT DO NOTHING;

-- Insert test user
INSERT INTO "Users" (   "Id", "TenantId", "Email", "FirstName", "LastName", "CreatedAt", "UpdatedAt", "DeletedAt" )
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'test@example.com',
  'Nicky',
  'Eichmann',
  now(),
  now(),
  null
)
ON CONFLICT DO NOTHING;

-- Insert sample ECG session
INSERT INTO "EcgSessions" (
  "Id", "TenantId", "UserId", "RecordedAt", "Classification",
  "AverageHeartRate", "Samples", "CreatedAt"
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  now() - interval '1 day',
  'Normal',
  72,
  '[{"time": 0, "value": 0.5}, {"time": 1, "value": 0.6}]'::jsonb,
  now()
)
ON CONFLICT DO NOTHING;

-- Insert sample blood pressure reading
INSERT INTO "BloodPressureReadings" (
  "Id", "TenantId", "UserId", "RecordedAt",
  "Systolic", "Diastolic", "Pulse", "CreatedAt"
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  now() - interval '2 days',
  120,
  80,
  72,
  now()
)
ON CONFLICT DO NOTHING;

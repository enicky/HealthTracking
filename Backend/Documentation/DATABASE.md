# Database Schema Documentation

## Overview

PostgreSQL 16+ database for multi-tenant health tracking system with optimized indexes and data model for scalability.

## Tables

### 1. Tenants Table

**Purpose:** Represents organizations/workspaces using the system

**Schema:**
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
```

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier (auto-generated) |
| `name` | TEXT | NOT NULL | Tenant organization name |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | - | Last modification timestamp |

**Indexes:**
- Primary Key on `id`

**Constraints:**
- No soft delete (tenants are permanent once created)

**Typical Records:**
```sql
INSERT INTO tenants (name) VALUES ('Acme Health Corp');
INSERT INTO tenants (name) VALUES ('John Doe Personal');
```

---

### 2. Users Table

**Purpose:** Represents individual users within a tenant

**Schema:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email) WHERE deleted_at IS NULL
);
```

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `tenant_id` | UUID | NOT NULL, FK | Reference to tenant |
| `email` | TEXT | NOT NULL | User email (unique per tenant) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | - | Last modification timestamp |
| `deleted_at` | TIMESTAMPTZ | - | Soft delete timestamp (NULL = active) |

**Indexes:**
```sql
-- Composite unique constraint on (tenant_id, email) when not soft-deleted
UNIQUE(tenant_id, email) WHERE deleted_at IS NULL

-- Search users by tenant
CREATE INDEX idx_users_tenant_id ON users(tenant_id)
WHERE deleted_at IS NULL;
```

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

**Soft Delete Pattern:**
- `deleted_at IS NULL` = active user
- `deleted_at IS NOT NULL` = deleted user (but data retained)

**Typical Records:**
```sql
INSERT INTO users (tenant_id, email) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'nicholas@example.com');
```

---

### 3. ECG Sessions Table

**Purpose:** Stores ECG recording sessions with classification and samples

**Schema:**
```sql
CREATE TABLE ecg_sessions (
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
```

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique ECG session identifier |
| `tenant_id` | UUID | NOT NULL, FK | Tenant ownership |
| `user_id` | UUID | NOT NULL, FK | User who recorded this |
| `recorded_at` | TIMESTAMPTZ | NOT NULL | When the ECG was recorded |
| `classification` | TEXT | NOT NULL | ECG classification (Normal, AFib, etc.) |
| `average_heart_rate` | INT | - | Calculated average heart rate (bpm) |
| `samples` | JSONB | NOT NULL | Raw ECG data points as JSON array |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `deleted_at` | TIMESTAMPTZ | - | Soft delete timestamp |

**Indexes:**
```sql
-- Performance optimization for typical queries
CREATE INDEX idx_ecg_tenant_user_time
ON ecg_sessions(tenant_id, user_id, recorded_at DESC)
WHERE deleted_at IS NULL;

-- Additional useful indexes
CREATE INDEX idx_ecg_user_id
ON ecg_sessions(user_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_ecg_created_at
ON ecg_sessions(created_at DESC) WHERE deleted_at IS NULL;
```

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

**Sample Data Structure:**

```json
{
  "samples": [
    {"time": 0, "voltage": 0.5, "quality": 1},
    {"time": 1, "voltage": 0.6, "quality": 1},
    {"time": 2, "voltage": 0.55, "quality": 1},
    {"time": 3, "voltage": 0.65, "quality": 1}
  ]
}
```

**Query Example:**
```sql
-- Get user's last 10 ECG sessions
SELECT id, recorded_at, classification, average_heart_rate
FROM ecg_sessions
WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL
ORDER BY recorded_at DESC
LIMIT 10;
-- Uses index: idx_ecg_tenant_user_time
```

---

### 4. Blood Pressure Readings Table

**Purpose:** Stores blood pressure measurements with systolic, diastolic, and pulse

**Schema:**
```sql
CREATE TABLE blood_pressure_readings (
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
```

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| `id` | UUID | PRIMARY KEY | Unique reading identifier |
| `tenant_id` | UUID | NOT NULL, FK | Tenant ownership |
| `user_id` | UUID | NOT NULL, FK | User who recorded this |
| `recorded_at` | TIMESTAMPTZ | NOT NULL | When BP was measured |
| `systolic` | INT | NOT NULL | Systolic pressure (mmHg) |
| `diastolic` | INT | NOT NULL | Diastolic pressure (mmHg) |
| `pulse` | INT | - | Heart rate (bpm) - optional |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Record creation timestamp |
| `deleted_at` | TIMESTAMPTZ | - | Soft delete timestamp |

**Indexes:**
```sql
-- Performance optimization for typical queries
CREATE INDEX idx_bp_tenant_user_time
ON blood_pressure_readings(tenant_id, user_id, recorded_at DESC)
WHERE deleted_at IS NULL;

-- Additional useful indexes
CREATE INDEX idx_bp_user_id
ON blood_pressure_readings(user_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_bp_created_at
ON blood_pressure_readings(created_at DESC) WHERE deleted_at IS NULL;
```

**Foreign Keys:**
- `tenant_id` → `tenants(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

**Data Validation:**
```sql
-- Add check constraints (in future)
ALTER TABLE blood_pressure_readings
ADD CONSTRAINT chk_systolic_diastolic 
CHECK (systolic > diastolic);

ALTER TABLE blood_pressure_readings
ADD CONSTRAINT chk_heart_rate_range
CHECK (pulse IS NULL OR (pulse >= 30 AND pulse <= 200));
```

**Query Example:**
```sql
-- Get user's last 30 days of BP readings
SELECT recorded_at, systolic, diastolic, pulse
FROM blood_pressure_readings
WHERE tenant_id = $1 
  AND user_id = $2 
  AND deleted_at IS NULL
  AND recorded_at >= now() - interval '30 days'
ORDER BY recorded_at DESC;
```

---

## Index Performance Analysis

### Index: `idx_ecg_tenant_user_time`

**Purpose:** Optimize queries for user's ECG sessions ordered by time

```sql
CREATE INDEX idx_ecg_tenant_user_time
ON ecg_sessions(tenant_id, user_id, recorded_at DESC)
WHERE deleted_at IS NULL;
```

**Query Benefits:**
```sql
-- ✓ Uses index efficiently (index scan)
SELECT * FROM ecg_sessions
WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL
ORDER BY recorded_at DESC;
-- Cost: 0.3ms, Rows: 50 (typical pagination)

-- ✗ Without index (table scan)
-- Cost: 450ms, Rows: 50
```

**Storage Size:**
- Typical: 5-50MB per 1M records

---

## Soft Delete Implementation

### Pattern

```sql
-- Active records
SELECT * FROM users WHERE deleted_at IS NULL;

-- Soft delete (recovery possible)
UPDATE users SET deleted_at = now() WHERE id = $1;

-- Hard delete (permanent - after retention)
DELETE FROM users WHERE deleted_at < now() - interval '90 days';
```

### Benefits

1. **Audit Trail:** Know when data was deleted
2. **Recovery:** Restore deleted data if needed
3. **Compliance:** GDPR right to erasure (with hard delete later)
4. **Referential Integrity:** Foreign keys still valid

### Drawbacks

1. **Storage:** Deleted data still takes space
2. **Complexity:** Always filter `deleted_at IS NULL`
3. **Performance:** Indexes must include WHERE clause

---

## Data Lifecycle

```
CREATE              ACTIVE              MODIFIED            DELETED             ARCHIVED
  │                   │                    │                  │                   │
  └─ INSERT ────────► Active ──────► Updated ────► Soft Delete ──────► Hard Delete
      user_id         record         (updated_at)  (deleted_at)        (removed)
      created_at                                   (after 90 days)
```

---

## Query Performance Tips

### Good Patterns ✓

```sql
-- Uses index idx_ecg_tenant_user_time
SELECT * FROM ecg_sessions
WHERE tenant_id = $1 AND user_id = $2
  AND deleted_at IS NULL
ORDER BY recorded_at DESC
LIMIT 50;
```

### Bad Patterns ✗

```sql
-- Full table scan (no index)
SELECT * FROM ecg_sessions
WHERE classification = 'Normal';

-- Index not used (OR clause)
SELECT * FROM ecg_sessions
WHERE user_id = $1 OR tenant_id = $2;

-- Implicit conversion defeats index
SELECT * FROM ecg_sessions
WHERE recorded_at::date = $1;  -- Convert to date range instead
```

---

## Storage Estimation

### Per 1 Million Records

| Table | Avg Row Size | Total Size | Indexes |
|-------|---|---|---|
| tenants | 100 bytes | 100 MB | < 1 MB |
| users | 200 bytes | 200 MB | 20 MB |
| ecg_sessions | 5 KB (with JSON) | 5 GB | 100 MB |
| blood_pressure_readings | 150 bytes | 150 MB | 20 MB |

**Total for ~1M users with ~100K readings each:** 500-1000 GB

---

## Backup Strategy

### Full Backup
```bash
# Daily full backup
pg_dump -h localhost -U healthtracking healthtracking > backup_2024-03-04.sql

# Size: ~30% of database
# Time: Depends on data volume
```

### Incremental Backup
```bash
# PostgreSQL transaction log archiving
# Enables point-in-time recovery

# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /archive/%f'
```

### Restore Process
```bash
# Full restore
psql -h localhost -U healthtracking healthtracking < backup_2024-03-04.sql

# Point-in-time restore
pg_restore -h localhost -U healthtracking --section=pre-data backup.dump
# (restore to specific timestamp)
```

---

## Monitoring Queries

### Check Database Size
```sql
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) 
FROM pg_database
WHERE datname = 'healthtracking';
```

### Check Table Sizes
```sql
SELECT 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Sizes
```sql
SELECT 
    indexname, 
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Find Unused Indexes
```sql
SELECT * FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Slow Queries
```sql
-- Enable log_min_duration_statement = 1000 in postgresql.conf

SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- > 100ms
ORDER BY mean_time DESC;
```

---

## Migration Scenarios

### Add New Field to Users
```sql
-- 1. Add column
ALTER TABLE users ADD COLUMN phone_number TEXT;

-- 2. Create index if needed
CREATE INDEX idx_users_phone ON users(phone_number) WHERE deleted_at IS NULL;

-- 3. Populate data
UPDATE users SET phone_number = '...' WHERE phone_number IS NULL;

-- 4. Add constraint if needed
ALTER TABLE users ADD CONSTRAINT uk_phone_number UNIQUE(phone_number);
```

### Resize Column
```sql
-- For TEXT columns, no resize needed

-- For VARCHAR with limit
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(512);
```

### Drop Old Data
```sql
-- Hard delete old soft-deleted records
DELETE FROM ecg_sessions 
WHERE deleted_at < now() - interval '90 days';

-- VACUUM to reclaim space
VACUUM FULL ecg_sessions;
```

---

## Common Issues & Solutions

### High Disk Usage
```sql
-- Check largest tables/indexes
SELECT * FROM pg_stat_user_tables 
ORDER BY heap_blks_read DESC;

-- Solution: Delete old soft-deleted data + VACUUM FULL
DELETE FROM blood_pressure_readings WHERE deleted_at < now() - interval '1 year';
VACUUM FULL blood_pressure_readings;
```

### Slow Queries
```sql
-- Analyze table
ANALYZE ecg_sessions;

-- Reindex if corrupted
REINDEX TABLE ecg_sessions;

-- Check for missing indexes
EXPLAIN ANALYZE 
SELECT * FROM ecg_sessions 
WHERE tenant_id = '...' AND user_id = '...';
```

### Connection Pool Exhaustion
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'active' AND query_start < now() - interval '10 minutes';
```

---

## Disaster Recovery Checklist

- [ ] Daily backups configured
- [ ] Standby replica configured
- [ ] Point-in-time recovery tested
- [ ] Backup retention policy defined (30+ days)
- [ ] Restore procedure documented
- [ ] Team trained on recovery
- [ ] Recovery time objective (RTO): < 1 hour
- [ ] Recovery point objective (RPO): < 1 hour

---

**Documentation Version:** 1.0  
**Last Updated:** 2024-03-04  
**PostgreSQL Version:** 16+

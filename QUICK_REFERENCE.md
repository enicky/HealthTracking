# Quick Reference Guide - Tenant Management System

## Initial Setup (First Time)

### 1. Backend Database Migration
```bash
cd Backend/src/HealthPlatform.Api
dotnet ef migrations add AddRoleAndPasswordHashToUser
dotnet ef database update
```

### 2. Create Super Admin User
Execute this SQL in your PostgreSQL database:
```sql
INSERT INTO users (id, tenant_id, email, first_name, last_name, password_hash, role, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'superadmin@example.com',
  'Super',
  'Admin',
  'YOUR_SHA256_PASSWORD_HASH',
  0,
  NOW(),
  NOW()
);
```

To generate password hash (example):
```javascript
// In browser console or Node.js:
const crypto = require('crypto');
crypto.createHash('sha256').update('yourpassword').digest('base64');
// Output: qvTr8...=
```

### 3. Update JWT Secret
Edit `appsettings.json` and `appsettings.Development.json`:
```json
"Jwt": {
  "SecretKey": "your-unique-secret-key-minimum-32-characters-change-this",
  "Issuer": "HealthPlatform",
  "Audience": "HealthPlatformUsers",
  "ExpirationMinutes": 1440
}
```

### 4. Start Servers
```bash
# Backend
cd Backend/src/HealthPlatform.Api
dotnet run

# Frontend
cd Frontend
npm run dev
```

## API Usage Examples

### Login
```bash
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "yourpassword"
}

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "superadmin@example.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SuperAdmin"
  }
}
```

### Get All Tenants (Super Admin Only)
```bash
GET http://localhost:5001/api/tenants
Authorization: Bearer <JWT_TOKEN>

# Response:
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tenant 1",
    "userCount": 5,
    "createdAt": "2024-03-10T10:00:00Z",
    "updatedAt": "2024-03-10T12:00:00Z"
  }
]
```

### Create Tenant (Super Admin Only)
```bash
POST http://localhost:5001/api/tenants
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "New Tenant",
  "adminEmail": "admin@newtenant.com",
  "adminFirstName": "John",
  "adminLastName": "Doe"
}

# Response:
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantName": "New Tenant",
  "adminUser": {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@newtenant.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TenantAdmin"
  },
  "defaultPassword": "kJ#mP9@xL2$qR"
}
```

### Update Tenant (Super Admin Only)
```bash
PUT http://localhost:5001/api/tenants/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Updated Tenant Name"
}
```

### Delete Tenant (Super Admin Only)
```bash
DELETE http://localhost:5001/api/tenants/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <JWT_TOKEN>
```

## Frontend Features Map

| Feature | Route | Visible To | Location |
|---------|-------|-----------|----------|
| Dashboard | `/dashboard` | All Users | Sidebar |
| Blood Pressure | `/blood-pressure` | All Users | Sidebar |
| ECG Sessions | `/ecg` | All Users | Sidebar |
| Tenant Management | `/tenants` | Super Admin Only | Sidebar → System Administration |
| Login | `/login` | Anonymous | Full Screen |

## User Roles & Capabilities

| Role | Tenants | Users | Data | Notes |
|------|---------|-------|------|-------|
| SuperAdmin | CRUD | View All | System | Complete system control |
| TenantAdmin | View Own | Manage Own Tenant | Own Tenant | Can manage users within tenant |
| User | N/A | N/A | Own Data | Can only access their own data |

## Common Tasks

### Add New Super Admin
```sql
INSERT INTO users (id, tenant_id, email, first_name, last_name, password_hash, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  'neweadmin@example.com',
  'New',
  'Admin',
  'PASSWORD_HASH_HERE',
  0,
  NOW(),
  NOW()
);
```

### Reset User Password
```sql
UPDATE users 
SET password_hash = 'NEW_PASSWORD_HASH_HERE'
WHERE email = 'user@example.com';
```

### Change User Role
```sql
UPDATE users 
SET role = 1
WHERE email = 'user@example.com';
-- 0 = SuperAdmin, 1 = TenantAdmin, 2 = User
```

### Verify Database Schema
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

## Troubleshooting

### "Invalid or missing authentication" Error
- Check JWT token is valid and not expired
- Verify Authorization header format: `Authorization: Bearer TOKEN`
- Ensure token was generated after password hash was added to database

### "Access Denied" to Tenant Endpoints
- Verify user has SuperAdmin role
- Check JWT token claims: use jwt.io to decode and inspect

### "Unauthorized" on Login
- Verify email is in correct case
- Check password hash matches (redraw if needed)
- Ensure user record exists in database

### Database Migration Issues
- Check database connection string
- Verify user has alter table permissions
- Always backup before running migrations

### CORS Issues (Frontend)
- Check `VITE_API_URL` environment variable
- Verify backend is running on correct port (5001)
- Check CORS headers in Program.cs

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001
```

### Backend (appsettings.json)
```json
{
  "Jwt": {
    "SecretKey": "your-secret-key-32-chars-minimum",
    "Issuer": "HealthPlatform",
    "Audience": "HealthPlatformUsers",
    "ExpirationMinutes": 1440
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=healthtracking;..."
  }
}
```

## Security Checklist

- [ ] Changed JWT SecretKey from default
- [ ] Created Super Admin user in database
- [ ] Tested login flow
- [ ] Verified tenant creation works
- [ ] Tested role-based access (non-admins can't access /tenants)
- [ ] Confirmed password hashing is working
- [ ] Set up HTTPS for production
- [ ] Disabled default credentials
- [ ] Tested logout clears session
- [ ] Verified token expiration works

## Performance Tips

1. **Token Caching**: Frontend caches token in localStorage
2. **Pagination**: Use skip/take parameters for large datasets
3. **Eager Loading**: API includes related data (user count per tenant)
4. **Connection Pooling**: Database uses connection pooling by default

## Next Steps

1. Implement password reset functionality
2. Add user management endpoints for TenantAdmins
3. Create audit logging for admin actions
4. Add 2FA for Super Admin accounts
5. Implement role-based API filtering
6. Add tenant quotas/limits

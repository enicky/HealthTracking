# Tenant Management & Role-Based Access Control - Implementation Guide

## Overview

You have successfully implemented a complete tenant management system with role-based access control (RBAC) and JWT authentication. This system supports:

- **SuperAdmin** role: Can manage all tenants and users across the system
- **TenantAdmin** role: Can manage users within their tenant
- **User** role: Can only view and manage their own data

## Architecture

### Backend Stack
- **Authentication**: JWT (JSON Web Tokens) with HS256 signing
- **Authorization**: Role-based access with custom attributes
- **Database**: PostgreSQL with EF Core migrations
- **API Pattern**: RESTful with role-protected endpoints

### Frontend Stack
- **State Management**: React Context API with AuthContext
- **Protected Routes**: Role-based component wrapper system
- **Storage**: LocalStorage for token persistence
- **UI Framework**: Bootstrap 5

## Database Changes

Two migrations were created:

1. **AddRoleAndPasswordToUser** - Adds new columns to User table:
   - `PasswordHash` (varchar 500) - SHA256 hashed password
   - `Role` (integer) - User role: 0=SuperAdmin, 1=TenantAdmin, 2=User (default)

2. **SeedSuperAdminUser** - Creates initial system data:
   - System Tenant (ID: 550e8400-e29b-41d4-a716-446655440000)
   - Super Admin User (admin@healthplatform.com)

## Default Credentials (for testing)

```
Email: admin@healthplatform.com
Password: AdminPassword123!
Role: SuperAdmin
```

⚠️ **Important**: Change this in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/validate` - Validate JWT token

### Tenant Management (Super Admin Only)
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/{id}` - Get specific tenant
- `POST /api/tenants` - Create new tenant with admin user
- `PUT /api/tenants/{id}` - Update tenant
- `DELETE /api/tenants/{id}` - Delete tenant

### Request Headers

For JWT authentication:
```
Authorization: Bearer <jwt_token>
```

For legacy header-based authentication (backward compatible):
```
X-Tenant-Id: <tenant-id>
X-User-Id: <user-id>
```

## Create Tenant Request

```http
POST /api/tenants
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Acme Health Corp",
  "adminEmail": "admin@acmhealth.com",
  "adminFirstName": "John",
  "adminLastName": "Doe"
}
```

**Response** (includes temporary password):
```json
{
  "tenantId": "guid",
  "tenantName": "Acme Health Corp",
  "adminUser": {
    "id": "guid",
    "tenantId": "guid",
    "email": "admin@acmhealth.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TenantAdmin"
  },
  "defaultPassword": "Temp#Pass123"
}
```

## Frontend Routes

New routes available:

- `/login` - Login page
- `/tenants` - Tenant management (Super Admin only)
- `/dashboard` - Dashboard
- `/blood-pressure` - Blood pressure records
- `/ecg` - ECG sessions

## Frontend Components

### Auth Context (`src/context/AuthContext.jsx`)
- `useAuth()` - Hook for authentication state
- Properties: user, token, isAuthenticated, isSuperAdmin, isTenantAdmin
- Methods: login(), logout()

### Role Protectors (`src/components/RoleProtected.jsx`)
- `<RoleProtected requiredRole="SuperAdmin">` - Custom role requirement
- `<SuperAdminOnly>` - Super admin only content
- `<TenantAdminOnly>` - Tenant admin and super admin
- `<ProtectedRoute>` - Authenticated users only

### Tenant Management (`src/features/tenants/`)
- `TenantManagement.jsx` - Main management page
- `TenantList.jsx` - Data table component
- `TenantModal.jsx` - Create/Edit form modal

## JWT Token Structure

The JWT token includes these claims:

```json
{
  "sub": "user-id",
  "tenant_id": "tenant-id",
  "email": "user@example.com",
  "role": "SuperAdmin",
  "iss": "HealthPlatform",
  "aud": "HealthPlatformUsers",
  "exp": 1234567890
}
```

Token expiration: 1440 minutes (24 hours) - configurable in `appsettings.json`

## Configuration

### Backend Settings (`appsettings.json`)

```json
"Jwt": {
  "SecretKey": "your-secret-key-min-32-characters-change-in-production",
  "Issuer": "HealthPlatform",
  "Audience": "HealthPlatformUsers",
  "ExpirationMinutes": 1440
}
```

**Production**: Update SecretKey to a strong, unique value!

### Frontend Settings

Set API URL (in `.env` or `vite.config.js`):
```
VITE_API_URL=http://localhost:5001
```

## Testing Workflow

### 1. Start the Backend
```bash
cd Backend/src/HealthPlatform.Api
dotnet build
dotnet run
```

Backend runs on: `http://localhost:5001`

### 2. Start the Frontend
```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3. Test Login
- Navigate to frontend login page
- Use: `admin@healthplatform.com` / `AdminPassword123!`
- Should receive JWT token and redirect to dashboard

### 4. Test Tenant Creation
- As Super Admin, navigate to Tenant Management (sidebar)
- Click "Create Tenant"
- Fill in tenant details and admin email
- New tenant should be created with TenantAdmin user

### 5. Verify Role-Based Access
- Try accessing tenant management as non-admin
- Should see "Access Denied" or empty state
- Verify sidebar admin section only shows for Super Admin

## Password Hashing

Passwords are hashed using SHA256:

```csharp
using (var sha256 = SHA256.Create())
{
    var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
    return Convert.ToBase64String(hashedBytes);
}
```

## Security Notes

1. **JWT Secret**: Must be at least 32 characters
2. **HTTPS**: Use HTTP only in development; require HTTPS in production
3. **Token Expiration**: Default 24 hours; adjust based on security requirements
4. **Password Policy**: Consider implementing password strength requirements
5. **Rate Limiting**: Add rate limiting to login endpoint in production
6. **CORS**: Configure CORS properly in production

## Troubleshooting

### "Invalid JWT Secret" Error
- Ensure `SecretKey` in `appsettings.json` is at least 32 characters
- Verify key is consistent between environments

### "Role not found" Error
- Ensure migrations have been applied
- Check that User.Role column exists in database

### Login Fails
- Verify super admin user was created by migration
- Check password hash in database matches
- Enable debug logging to see detailed errors

### Tenant Management Page Shows "Access Denied"
- Verify user role is SuperAdmin in JWT token
- Check that role claim is being properly decoded
- Use browser dev tools to inspect token

## Next Steps

1. ✅ Implement password change functionality
2. ✅ Add user management endpoints for TenantAdmins
3. ✅ Implement password reset/recovery
4. ✅ Add audit logging for admin actions
5. ✅ Add two-factor authentication (2FA)
6. ✅ Implement refresh token rotation
7. ✅ Add role-based API scopes
8. ✅ Create admin dashboard with analytics

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `dotnet run`
3. Check browser console for frontend errors
4. Verify database migrations applied: `dotnet ef migrations list`

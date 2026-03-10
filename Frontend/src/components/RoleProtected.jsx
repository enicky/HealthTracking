import React from 'react'
import { useAuth } from '../context/AuthContext'

// Role mappings - must match backend UserRole enum
const ROLES = {
  SuperAdmin: 0,
  TenantAdmin: 1,
  User: 2,
}

/**
 * Converts role name(s) to role value(s)
 * @param {string|string[]|number|number[]} role - Role name(s) or numeric value(s)
 * @returns {number[]} Array of numeric role values
 */
function normalizeRoles(role) {
  if (Array.isArray(role)) {
    return role.map(r => typeof r === 'string' ? ROLES[r] : r).filter(r => r !== undefined)
  }
  
  if (typeof role === 'string') {
    return [ROLES[role]].filter(r => r !== undefined)
  }
  
  if (typeof role === 'number') {
    return [role]
  }
  
  return []
}

/**
 * Component that restricts rendering based on user roles
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string|string[]|number|number[]} props.requiredRole - Required role(s) - 'SuperAdmin', 'TenantAdmin', 'User', or numeric values 0, 1, 2
 * @param {React.ReactNode} props.fallback - Content to render if not authorized
 */
export const RoleProtected = ({ children, requiredRole, fallback = null }) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null
  }

  const requiredRoles = normalizeRoles(requiredRole)
  const hasAccess = requiredRoles.includes(user?.role)

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

/**
 * Component that restricts rendering to Super Admins only
 */
export const SuperAdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleProtected requiredRole={0} fallback={fallback}>
      {children}
    </RoleProtected>
  )
}

/**
 * Component that restricts rendering to Tenant Admins and Super Admins
 */
export const TenantAdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleProtected requiredRole={[0, 1]} fallback={fallback}>
      {children}
    </RoleProtected>
  )
}

/**
 * Component that requires authentication
 */
export const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

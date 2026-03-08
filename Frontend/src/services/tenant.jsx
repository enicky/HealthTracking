import React, { createContext } from 'react'

/**
 * Tenant context for managing multi-tenant isolation
 */
export const TenantContext = createContext()

/**
 * Provider component for tenant context
 * @param {Object} props
 * @param {string} props.tenantId - Tenant identifier
 * @param {string} props.userId - User identifier
 * @param {React.ReactNode} props.children - Child components
 */
export function TenantProvider({ tenantId, userId, children }) {
  const value = {
    tenantId,
    userId,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

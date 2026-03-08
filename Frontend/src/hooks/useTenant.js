import { useContext } from 'react'
import { TenantContext } from '../services/tenant'

/**
 * Hook to access tenant context
 * @returns {Object} Tenant and user IDs
 * @throws {Error} If used outside TenantProvider
 */
export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

import { useContext } from 'react'
import { TenantContext } from './tenantContext'

export function useTenant() {
  const tenant = useContext(TenantContext)
  if (!tenant) throw new Error('useTenant must be used within TenantProvider')
  return tenant
}

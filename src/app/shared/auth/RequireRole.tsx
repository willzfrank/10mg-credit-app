import type { ReactNode } from 'react'
import { useTenant } from '../../features/tenant/useTenant'
import { useSession, type Role } from './authStore'

interface RequireRoleProps {
  roles: Role[]
  fallback?: ReactNode
  children: ReactNode
}

export function RequireRole({ roles, fallback = null, children }: RequireRoleProps) {
  const { slug } = useTenant()
  const session = useSession(slug)
  if (!session || !roles.includes(session.user.role)) return fallback
  return children
}

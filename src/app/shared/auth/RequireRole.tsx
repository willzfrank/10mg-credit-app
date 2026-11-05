import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useTenant } from '../../features/tenant/useTenant'
import { useSession, type Role } from './authStore'
import { homePathFor } from './homePath'

interface RequireRoleProps {
  roles: Role[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { slug } = useTenant()
  const session = useSession(slug)
  if (!session) return <Navigate to="/login" replace />
  if (!roles.includes(session.user.role)) return <Navigate to={homePathFor(session.user.role)} replace />
  return children
}

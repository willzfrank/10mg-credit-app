import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { mockTenants } from '../../mocks/tenants'
import { TenantContext } from '../../features/tenant/tenantContext'
import { RequireRole } from './RequireRole'
import { useAuthStore, type Role } from './authStore'

const wrapper = ({ children }: { children: ReactNode }) => (
  <TenantContext.Provider value={mockTenants.acme}>{children}</TenantContext.Provider>
)

const signIn = (role: Role) =>
  useAuthStore.getState().setSession('acme', {
    accessToken: 'token',
    user: { id: 'u1', name: 'User', email: 'u@acme.test', role },
  })

const renderGuard = () =>
  render(
    <RequireRole roles={['lender_admin']} fallback={<p>Not allowed</p>}>
      <p>Dashboard</p>
    </RequireRole>,
    { wrapper },
  )

describe('RequireRole', () => {
  it('renders children for an allowed role', () => {
    signIn('lender_admin')
    renderGuard()
    expect(screen.queryByText('Dashboard')).not.toBeNull()
    expect(screen.queryByText('Not allowed')).toBeNull()
  })

  it('renders the fallback for a disallowed role', () => {
    signIn('customer')
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Not allowed')).not.toBeNull()
  })

  it('renders the fallback when signed out', () => {
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Not allowed')).not.toBeNull()
  })

  it('does not use a session from another tenant', () => {
    useAuthStore.getState().setSession('zenith', {
      accessToken: 'token',
      user: { id: 'u2', name: 'Zed', email: 'zed@zenith.test', role: 'lender_admin' },
    })
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
  })
})

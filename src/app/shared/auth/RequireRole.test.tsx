import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TenantContext } from '../../features/tenant/tenantContext'
import { mockTenants } from '../../mocks/tenants'
import { RequireRole } from './RequireRole'
import { useAuthStore, type Role } from './authStore'

const signIn = (role: Role, slug = 'acme') =>
  useAuthStore.getState().setSession(slug, {
    accessToken: 'token',
    user: { id: 'u1', name: 'User', email: 'u@acme.test', role },
  })

const renderGuard = () =>
  render(
    <TenantContext.Provider value={mockTenants.acme}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireRole roles={['lender_admin']}>
                <p>Dashboard</p>
              </RequireRole>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/portal" element={<p>Portal page</p>} />
        </Routes>
      </MemoryRouter>
    </TenantContext.Provider>,
  )

describe('RequireRole', () => {
  it('renders children for an allowed role', () => {
    signIn('lender_admin')
    renderGuard()
    expect(screen.queryByText('Dashboard')).not.toBeNull()
  })

  it('sends a wrong-role user to their own home', () => {
    signIn('customer')
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Portal page')).not.toBeNull()
  })

  it('sends a signed-out user to /login', () => {
    renderGuard()
    expect(screen.queryByText('Login page')).not.toBeNull()
  })

  it('does not use a session from another tenant', () => {
    signIn('lender_admin', 'zenith')
    renderGuard()
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Login page')).not.toBeNull()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { queryClient } from '../../shared/queryClient'
import { TenantContext } from '../tenant/tenantContext'

describe('AppShell sign out', () => {
  it('signs out and navigates to login without errors', async () => {
    await login('acme', { email: 'ada@acme.test', password: 'password123' })
    render(
      <QueryClientProvider client={queryClient}>
        <TenantContext.Provider value={mockTenants.acme}>
          <MemoryRouter initialEntries={['/admin']}>
            <App />
          </MemoryRouter>
        </TenantContext.Provider>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).not.toBeNull()

    // Find the user profile button
    const userButton = screen.getByText('Ada Obi')
    fireEvent.click(userButton)

    // Find the Sign out item
    const signOutButton = await screen.findByText('Sign out')
    fireEvent.click(signOutButton)

    // Check if Sign in heading appears
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sign in to/ })).not.toBeNull()
    })
  })
})

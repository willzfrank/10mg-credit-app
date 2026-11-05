import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { queryClient } from '../../shared/queryClient'
import { TenantContext } from '../tenant/tenantContext'

describe('loan details page', () => {
  it('shows “Loan not found” for another customer’s loan', async () => {
    await login('acme', { email: 'chidi@acme.test', password: 'password123' })
    render(
      <QueryClientProvider client={queryClient}>
        <TenantContext.Provider value={mockTenants.acme}>
          <MemoryRouter initialEntries={['/portal/loans/loan_acme_2']}>
            <App />
          </MemoryRouter>
        </TenantContext.Provider>
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Loan not found' })).not.toBeNull()
  })
})

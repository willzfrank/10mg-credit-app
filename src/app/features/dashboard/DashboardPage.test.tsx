import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { queryClient } from '../../shared/queryClient'
import { TenantContext } from '../tenant/tenantContext'

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={mockTenants.acme}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </TenantContext.Provider>
    </QueryClientProvider>,
  )

describe('admin dashboard', () => {
  it('approving a pending row updates the row and the pending KPI', async () => {
    await login('acme', { email: 'ada@acme.test', password: 'password123' })
    renderAt('/admin')

    const pendingKpi = () => screen.getByRole('group', { name: 'Pending applications' })
    await waitFor(() => expect(pendingKpi().textContent).toContain('2'))
    expect((await screen.findAllByTestId('status-loan_acme_2'))[0].textContent).toBe('pending')

    fireEvent.click((await screen.findAllByRole('button', { name: 'Approve loan_acme_2' }))[0])

    await waitFor(() => expect(screen.getAllByTestId('status-loan_acme_2')[0].textContent).toBe('approved'))
    expect(screen.queryAllByRole('button', { name: 'Approve loan_acme_2' })).toHaveLength(0)
    await waitFor(() => expect(within(pendingKpi()).getByText('1')).not.toBeNull())
  })

  it('redirects a customer away from /admin', async () => {
    await login('acme', { email: 'chidi@acme.test', password: 'password123' })
    renderAt('/admin')

    expect(await screen.findByRole('heading', { name: 'My loans' })).not.toBeNull()
    expect(screen.queryByText('Pending applications')).toBeNull()
  })
})

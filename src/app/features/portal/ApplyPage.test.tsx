import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from '../../../App'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { queryClient } from '../../shared/queryClient'
import { submitApplication } from '../loans/api'
import { TenantContext } from '../tenant/tenantContext'

vi.mock('../loans/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../loans/api')>()),
  submitApplication: vi.fn(),
}))

describe('ApplyPage validation', () => {
  it('shows inline errors for out-of-range amounts and a fractional tenor, and never submits', async () => {
    await login('acme', { email: 'chidi@acme.test', password: 'password123' })
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TenantContext.Provider value={mockTenants.acme}>
          <MemoryRouter initialEntries={['/portal/apply']}>
            <App />
          </MemoryRouter>
        </TenantContext.Provider>
      </QueryClientProvider>,
    )
    await screen.findByRole('heading', { name: 'Apply for a loan' })

    const fill = (amount: string, tenor: string) => {
      fireEvent.change(container.querySelector('input[name="amount"]')!, { target: { value: amount } })
      fireEvent.change(container.querySelector('input[name="tenorMonths"]')!, { target: { value: tenor } })
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    }

    fill('100', '6')
    expect(await screen.findByText(/Amount must be at least/)).not.toBeNull()

    fill('9000000', '6')
    expect(await screen.findByText(/Amount must be at most/)).not.toBeNull()

    fill('100000', '1.5')
    expect(await screen.findByText('Use whole months')).not.toBeNull()

    expect(submitApplication).not.toHaveBeenCalled()
  })
})

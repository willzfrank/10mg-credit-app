import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { queryClient } from '../../shared/queryClient'
import { TenantContext } from '../tenant/tenantContext'

async function openLoan() {
  await login('acme', { email: 'chidi@acme.test', password: 'password123' })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={mockTenants.acme}>
        <MemoryRouter initialEntries={['/portal/loans/loan_acme_1']}>
          <App />
        </MemoryRouter>
      </TenantContext.Provider>
    </QueryClientProvider>,
  )
  await screen.findByRole('region', { name: 'Make a repayment' })
  return view
}

describe('repayment form', () => {
  it('rejects overpayment inline, then records a valid payment in the history', async () => {
    const { container } = await openLoan()
    const amount = container.querySelector('input[name="amount"]')!
    const pay = () => fireEvent.click(screen.getByRole('button', { name: 'Pay' }))

    fireEvent.change(amount, { target: { value: '999999' } })
    pay()
    expect(await screen.findByText(/Amount can be at most/)).not.toBeNull()

    fireEvent.change(amount, { target: { value: '5000' } })
    pay()
    expect(await screen.findByText('Repayment recorded.')).not.toBeNull()
    expect(await screen.findAllByText(/5,000\.00/)).not.toBeNull()
  })

  it('pays the full balance, which hides the form and marks the loan repaid', async () => {
    await openLoan()
    fireEvent.click(screen.getByRole('button', { name: 'Pay full balance' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Make a repayment' })).toBeNull())
    expect(screen.getByText('100% Repaid')).not.toBeNull()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'
import { mockTenants } from '../../mocks/tenants'
import { queryClient } from '../../shared/queryClient'
import { TenantContext } from '../tenant/tenantContext'

function renderLoginPage(tenant = mockTenants.zenith) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={tenant}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </TenantContext.Provider>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('renders modern company-branded sign in heading and inputs', () => {
    renderLoginPage(mockTenants.zenith)

    expect(screen.getByRole('heading', { name: /Sign in to Zenith Credit/ })).not.toBeNull()
    expect(screen.getByLabelText(/Email address/i)).not.toBeNull()
    expect(screen.getByLabelText(/^Password/i)).not.toBeNull()
    expect(screen.getByRole('button', { name: /^Sign in$/ })).not.toBeNull()
  })

  it('autofills credentials when clicking quick demo account buttons', async () => {
    renderLoginPage(mockTenants.zenith)

    const adminButton = screen.getByText('Lender Admin')
    fireEvent.click(adminButton)

    const emailInput = screen.getByLabelText(/Email address/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement

    expect(emailInput.value).toBe('zed@zenith.test')
    expect(passwordInput.value).toBe('password123')
  })

  it('validates empty inputs on submit', async () => {
    renderLoginPage(mockTenants.zenith)

    const submitButton = screen.getByRole('button', { name: /^Sign in$/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).not.toBeNull()
      expect(screen.getByText('Password is required')).not.toBeNull()
    })
  })

  it('does not reveal other institutions or offer a tenant switcher', () => {
    const { container } = renderLoginPage(mockTenants.acme)

    expect(container.textContent).not.toMatch(/Zenith/)
    expect(container.textContent).not.toContain('zenith.test')
    expect(screen.queryByRole('button', { name: /Zenith/ })).toBeNull()
  })
})

import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { revokeToken } from '../../mocks/db'
import { mockTenants } from '../../mocks/tenants'
import { login } from '../../shared/auth/authApi'
import { getSession } from '../../shared/auth/authStore'
import { queryClient } from '../../shared/queryClient'
import { TenantConfigPage } from './TenantConfigPage'
import { TenantContext } from './tenantContext'

const admin = { email: 'ada@acme.test', password: 'password123' }
const root = () => document.documentElement.style

function renderPage() {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TenantContext.Provider value={mockTenants.acme}>
        <MemoryRouter>
          <TenantConfigPage />
        </MemoryRouter>
      </TenantContext.Provider>
    </QueryClientProvider>,
  )
  const field = (name: string) => view.container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
  const change = (name: string, value: string) => fireEvent.change(field(name), { target: { value } })
  return { field, change }
}

describe('TenantConfigPage', () => {
  it('Cancel restores the saved colours on :root', () => {
    mockTenants.acme.colors = { primary: '#0f766e' }
    const { change } = renderPage()
    expect(root().getPropertyValue('--primary')).toBe('#0f766e')

    change('colors.primary', '#ff0000')
    expect(root().getPropertyValue('--primary')).toBe('#ff0000')

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(root().getPropertyValue('--primary')).toBe('#0f766e')
  })

  it('blocks Save on invalid input', async () => {
    await login('acme', admin)
    const { change } = renderPage()
    change('settings.minLoanAmount', '')
    change('logoUrl', 'javascript:alert(1)')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter a number')).not.toBeNull()
    expect(screen.queryByText('Use an http(s) URL, a path starting with /, or upload an image (max 200 KB)')).not.toBeNull()
    expect(screen.queryByText('Saving…')).toBeNull()
    expect(mockTenants.acme.logoUrl).toBe('/logos/acme.svg')
  })

  it('logs out when Save returns 401', async () => {
    const session = await login('acme', admin)
    revokeToken(session.accessToken)
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(getSession('acme')).toBeUndefined())
  })
})

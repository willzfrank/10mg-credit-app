import { describe, expect, it } from 'vitest'
import { ForbiddenError, NotFoundError } from '../../shared/api/errors'
import { login } from '../../shared/auth/authApi'
import { mockTenants } from '../../mocks/tenants'
import { fetchTenantConfig, updateTenantConfig } from './api'

describe('fetchTenantConfig', () => {
  it('returns known tenants and throws NotFoundError for unknown or prototype-key slugs', async () => {
    expect((await fetchTenantConfig('acme')).slug).toBe('acme')
    await expect(fetchTenantConfig('nope')).rejects.toBeInstanceOf(NotFoundError)
    await expect(fetchTenantConfig('constructor')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns copies, so callers cannot mutate the stored config', async () => {
    const config = await fetchTenantConfig('acme')
    config.name = 'Tampered'
    expect((await fetchTenantConfig('acme')).name).toBe('Acme Microfinance')
  })
})

describe('updateTenantConfig', () => {
  const { name, logoUrl, colors, settings } = mockTenants.acme

  it('only lets a lender_admin update their own tenant', async () => {
    const lender = await login('acme', { email: 'ada@acme.test', password: 'password123' })
    const updated = await updateTenantConfig(lender.accessToken, 'acme', { name: 'Acme Renamed', logoUrl, colors, settings })
    expect(updated.name).toBe('Acme Renamed')
    expect((await fetchTenantConfig('zenith')).name).toBe('Zenith Credit')

    const customer = await login('acme', { email: 'chidi@acme.test', password: 'password123' })
    await expect(updateTenantConfig(customer.accessToken, 'acme', { name, logoUrl, colors, settings })).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })

  it('rejects a lender_admin targeting another tenant', async () => {
    const lender = await login('acme', { email: 'ada@acme.test', password: 'password123' })
    await expect(updateTenantConfig(lender.accessToken, 'zenith', { name, logoUrl, colors, settings })).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })
})

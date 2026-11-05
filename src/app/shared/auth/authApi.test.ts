import { describe, expect, it } from 'vitest'
import { UnauthorizedError } from '../api/errors'
import { queryClient } from '../queryClient'
import { login, logout } from './authApi'
import { getSession } from './authStore'

const acme = { email: 'chidi@acme.test', password: 'password123' }

describe('auth', () => {
  it('scopes sessions per tenant and rejects another tenant’s credentials', async () => {
    await login('acme', acme)
    expect(getSession('acme')?.user.role).toBe('customer')
    expect(getSession('zenith')).toBeUndefined()
    await expect(login('zenith', acme)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('normalizes the email on login', async () => {
    await login('acme', { email: '  Chidi@ACME.test ', password: 'password123' })
    expect(getSession('acme')).toBeDefined()
  })

  it('persists the session under a per-tenant key and removes it on logout', async () => {
    await login('acme', acme)
    expect(JSON.parse(sessionStorage.getItem('session:acme') ?? 'null').user.email).toBe('chidi@acme.test')
    expect(sessionStorage.getItem('session:zenith')).toBeNull()
    await logout('acme')
    expect(sessionStorage.getItem('session:acme')).toBeNull()
  })

  it('clears cached queries on logout except tenant keys', async () => {
    await login('acme', acme)
    queryClient.setQueryData(['loans'], [1])
    queryClient.setQueryData(['tenant', 'acme', 'config'], { name: 'Acme' })
    await logout('acme')
    expect(getSession('acme')).toBeUndefined()
    expect(queryClient.getQueryData(['loans'])).toBeUndefined()
    expect(queryClient.getQueryData(['tenant', 'acme', 'config'])).toEqual({ name: 'Acme' })
  })
})

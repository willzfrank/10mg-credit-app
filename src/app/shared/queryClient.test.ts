import { describe, expect, it } from 'vitest'
import { ForbiddenError, UnauthorizedError } from './api/errors'
import { login } from './auth/authApi'
import { getSession } from './auth/authStore'
import { queryClient } from './queryClient'

const fail = (error: Error) => () => Promise.reject(error)
const run = (queryKey: string[], error: Error) =>
  queryClient.fetchQuery({ queryKey, queryFn: fail(error), meta: { tenantSlug: 'acme' }, retry: false }).catch(() => {})

describe('queryClient 401 handling', () => {
  it('logs out on a 401 query, but not for tenant keys or 403s', async () => {
    await login('acme', { email: 'ada@acme.test', password: 'password123' })

    await run(['tenant', 'acme', 'config'], new UnauthorizedError())
    await run(['loans'], new ForbiddenError())
    expect(getSession('acme')).toBeDefined()

    await run(['loans'], new UnauthorizedError())
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 100))
    expect(getSession('acme')).toBeUndefined()
  })
})

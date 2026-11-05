import { describe, expect, it } from 'vitest'
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../shared/api/errors'
import { login } from '../../shared/auth/authApi'
import { getLoan, listLoans, submitApplication } from './api'

const customer = { email: 'chidi@acme.test', password: 'password123' }
const lender = { email: 'ada@acme.test', password: 'password123' }

describe('loan visibility', () => {
  it('lets a customer see only their own loans', async () => {
    const { accessToken } = await login('acme', customer)
    expect((await getLoan(accessToken, 'loan_acme_1')).id).toBe('loan_acme_1')
    await expect(getLoan(accessToken, 'loan_acme_2')).rejects.toBeInstanceOf(NotFoundError)
    await expect(getLoan(accessToken, 'loan_zenith_1')).rejects.toBeInstanceOf(NotFoundError)
    await expect(getLoan(accessToken, 'missing')).rejects.toBeInstanceOf(NotFoundError)
    await expect(getLoan('bad-token', 'loan_acme_1')).rejects.toBeInstanceOf(UnauthorizedError)
    expect((await listLoans(accessToken)).map((l) => l.id)).toEqual(['loan_acme_1'])
  })

  it('lets a lender_admin see the whole tenant but nothing from other tenants', async () => {
    const { accessToken } = await login('acme', lender)
    expect((await listLoans(accessToken)).map((l) => l.id)).toEqual(['loan_acme_1', 'loan_acme_2'])
    expect((await getLoan(accessToken, 'loan_acme_2')).id).toBe('loan_acme_2')
    await expect(getLoan(accessToken, 'loan_zenith_1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns copies, so callers cannot mutate stored loans', async () => {
    const { accessToken } = await login('acme', customer)
    const loan = await getLoan(accessToken, 'loan_acme_1')
    loan.amount = 1
    expect((await getLoan(accessToken, 'loan_acme_1')).amount).toBe(150000)
  })
})

describe('submitApplication', () => {
  const input = { amount: 100000, tenorMonths: 6, idempotencyKey: 'key-1' }

  it('returns the existing record for the same key and body, and conflicts on a different body', async () => {
    const { accessToken } = await login('acme', customer)
    const first = await submitApplication(accessToken, input)
    expect((await submitApplication(accessToken, input)).id).toBe(first.id)
    await expect(submitApplication(accessToken, { ...input, amount: 120000 })).rejects.toBeInstanceOf(ConflictError)
    expect((await submitApplication(accessToken, { ...input, idempotencyKey: 'key-2' })).id).not.toBe(first.id)
  })

  it('validates amount and tenor against the tenant settings', async () => {
    const { accessToken } = await login('acme', customer)
    const attempt = (overrides: object) =>
      submitApplication(accessToken, { ...input, idempotencyKey: crypto.randomUUID(), ...overrides })

    await expect(attempt({ amount: 1000 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amount: 9_000_000 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amount: Number.NaN })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 0 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 13 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 2.5 })).rejects.toBeInstanceOf(ValidationError)
  })
})

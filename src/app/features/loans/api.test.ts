import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../../shared/api/errors'
import { login } from '../../shared/auth/authApi'
import { getDashboardSummary } from '../dashboard/api'
import { getLoan, listLoanRepayments, listLoans, makeRepayment, submitApplication } from './api'
import { outstandingMinor } from './money'

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
    expect((await listLoans(accessToken)).map((l) => l.id)).toEqual(Array.from({ length: 7 }, (_, i) => `loan_acme_${i + 1}`))
    expect((await getLoan(accessToken, 'loan_acme_2')).id).toBe('loan_acme_2')
    await expect(getLoan(accessToken, 'loan_zenith_1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns copies, so callers cannot mutate stored loans', async () => {
    const { accessToken } = await login('acme', customer)
    const loan = await getLoan(accessToken, 'loan_acme_1')
    loan.amountMinor = 1
    expect((await getLoan(accessToken, 'loan_acme_1')).amountMinor).toBe(15_000_000)
  })
})

describe('submitApplication', () => {
  const input = { amountMinor: 10_000_000, tenorMonths: 6, idempotencyKey: 'key-1' }

  it('returns the existing record for the same key and body, and conflicts on a different body', async () => {
    const { accessToken } = await login('acme', customer)
    const first = await submitApplication(accessToken, input)
    expect((await submitApplication(accessToken, input)).id).toBe(first.id)
    await expect(submitApplication(accessToken, { ...input, amountMinor: 12_000_000 })).rejects.toBeInstanceOf(ConflictError)
    expect((await submitApplication(accessToken, { ...input, idempotencyKey: 'key-2' })).id).not.toBe(first.id)
  })

  it('validates amount and tenor against the tenant settings', async () => {
    const { accessToken } = await login('acme', customer)
    const attempt = (overrides: object) =>
      submitApplication(accessToken, { ...input, idempotencyKey: crypto.randomUUID(), ...overrides })

    await expect(attempt({ amountMinor: 100_000 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amountMinor: 900_000_000 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amountMinor: Number.NaN })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amountMinor: 10_000_000.5 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amountMinor: 0 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ amountMinor: -10_000_000 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 0 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 13 })).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt({ tenorMonths: 2.5 })).rejects.toBeInstanceOf(ValidationError)
  })

  it('stores a pending loan with tenant, minor-unit amount and a rate snapshot that shows in the lender summary', async () => {
    const { accessToken } = await login('acme', customer)
    const admin = (await login('acme', lender)).accessToken
    const before = await getDashboardSummary(admin)

    const loan = await submitApplication(accessToken, input)
    expect(loan).toMatchObject({ tenantId: 'tnt_001', amountMinor: 10_000_000, tenorMonths: 6, ratePct: 4.5, status: 'pending' })
    expect(Number.isNaN(Date.parse(loan.createdAt))).toBe(false)

    const after = await getDashboardSummary(admin)
    expect(after.applications).toBe(before.applications + 1)
    expect(Number.isFinite(after.outstandingMinor)).toBe(true)
  })
})

describe('customer ownership and idempotency', () => {
  it('hides another customer’s or tenant’s loan and its repayments', async () => {
    const { accessToken } = await login('acme', customer)
    expect((await listLoanRepayments(accessToken, 'loan_acme_1')).length).toBe(4)
    for (const id of ['loan_acme_3', 'loan_zenith_2', 'missing']) {
      await expect(getLoan(accessToken, id)).rejects.toBeInstanceOf(NotFoundError)
      await expect(listLoanRepayments(accessToken, id)).rejects.toBeInstanceOf(NotFoundError)
    }
    const dates = (await listLoanRepayments(accessToken, 'loan_acme_1')).map((r) => r.paidAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('creates exactly one loan when the same key is submitted twice at once', async () => {
    const { accessToken } = await login('acme', customer)
    const before = (await listLoans(accessToken)).length
    const input = { amountMinor: 10_000_000, tenorMonths: 6, idempotencyKey: 'double-submit' }
    const [a, b] = await Promise.all([submitApplication(accessToken, input), submitApplication(accessToken, input)])
    expect(a.id).toBe(b.id)
    expect((await listLoans(accessToken)).length).toBe(before + 1)
  })
})

describe('makeRepayment', () => {
  // loan_acme_1: total payable 15,675,000 minus 4,000,000 already paid = 11,675,000 outstanding.
  it('records a repayment and reduces the outstanding balance', async () => {
    const { accessToken } = await login('acme', customer)
    const repayment = await makeRepayment(accessToken, 'loan_acme_1', { amountMinor: 1_000_000 })
    expect(repayment).toMatchObject({ loanId: 'loan_acme_1', tenantId: 'tnt_001', amountMinor: 1_000_000 })

    const loan = await getLoan(accessToken, 'loan_acme_1')
    const rows = await listLoanRepayments(accessToken, 'loan_acme_1')
    expect(rows).toHaveLength(5)
    expect(outstandingMinor(loan, rows)).toBe(10_675_000)
    expect(loan.status).toBe('approved')
  })

  it('marks the loan repaid when the balance is cleared and then refuses further payments', async () => {
    const { accessToken } = await login('acme', customer)
    await makeRepayment(accessToken, 'loan_acme_1', { amountMinor: 11_675_000 })
    const loan = await getLoan(accessToken, 'loan_acme_1')
    expect(loan.status).toBe('repaid')
    expect(outstandingMinor(loan, await listLoanRepayments(accessToken, 'loan_acme_1'))).toBe(0)
    await expect(makeRepayment(accessToken, 'loan_acme_1', { amountMinor: 100 })).rejects.toBeInstanceOf(ConflictError)
  })

  it('rejects overpayment and invalid amounts', async () => {
    const { accessToken } = await login('acme', customer)
    for (const amountMinor of [11_675_001, 0, -5, 10.5, Number.NaN]) {
      await expect(makeRepayment(accessToken, 'loan_acme_1', { amountMinor })).rejects.toBeInstanceOf(ValidationError)
    }
    expect(await listLoanRepayments(accessToken, 'loan_acme_1')).toHaveLength(4)
  })

  it('only lets the borrower repay an approved loan', async () => {
    const { accessToken } = await login('acme', customer)
    await expect(makeRepayment(accessToken, 'loan_acme_3', { amountMinor: 100 })).rejects.toBeInstanceOf(NotFoundError)
    await expect(makeRepayment(accessToken, 'loan_zenith_2', { amountMinor: 100 })).rejects.toBeInstanceOf(NotFoundError)
    const { accessToken: bola } = await login('acme', { email: 'bola@acme.test', password: 'password123' })
    await expect(makeRepayment(bola, 'loan_acme_2', { amountMinor: 100 })).rejects.toBeInstanceOf(ConflictError)
    const { accessToken: admin } = await login('acme', lender)
    await expect(makeRepayment(admin, 'loan_acme_1', { amountMinor: 100 })).rejects.toBeInstanceOf(ForbiddenError)
    await expect(makeRepayment('bad-token', 'loan_acme_1', { amountMinor: 100 })).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('shows up in the lender dashboard totals', async () => {
    const { accessToken } = await login('acme', customer)
    const admin = (await login('acme', lender)).accessToken
    const before = await getDashboardSummary(admin)
    await makeRepayment(accessToken, 'loan_acme_1', { amountMinor: 1_000_000 })
    expect((await getDashboardSummary(admin)).outstandingMinor).toBe(before.outstandingMinor - 1_000_000)
  })
})

import { describe, expect, it } from 'vitest'
import { mockLoans } from '../../mocks/db'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/api/errors'
import { login } from '../../shared/auth/authApi'
import { decideLoan, getDashboardSummary, listCustomers, listRepayments } from './api'

const password = 'password123'
const tokenFor = async (slug: string, email: string) => (await login(slug, { email, password })).accessToken
const acmeAdmin = () => tokenFor('acme', 'ada@acme.test')
const zenithAdmin = () => tokenFor('zenith', 'zed@zenith.test')

describe('dashboard authorization', () => {
  it('rejects a customer token on every dashboard function', async () => {
    const token = await tokenFor('acme', 'chidi@acme.test')
    await expect(getDashboardSummary(token)).rejects.toBeInstanceOf(ForbiddenError)
    await expect(listCustomers(token)).rejects.toBeInstanceOf(ForbiddenError)
    await expect(listRepayments(token)).rejects.toBeInstanceOf(ForbiddenError)
    await expect(decideLoan(token, 'loan_acme_2', 'approved')).rejects.toBeInstanceOf(ForbiddenError)
    expect(mockLoans.find((l) => l.id === 'loan_acme_2')?.status).toBe('pending')
  })

  it('never shows one tenant’s rows to another tenant’s admin', async () => {
    const acme = await acmeAdmin()
    const zenith = await zenithAdmin()

    expect(await getDashboardSummary(acme)).toEqual({
      applications: 2,
      customers: 3,
      approvedLoans: 3,
      outstandingMinor: 52_700_000, // 11,675,000 + 15,675,000 + 25,350,000 kobo
    })
    expect((await getDashboardSummary(zenith)).customers).toBe(3)

    const acmeCustomers = await listCustomers(acme)
    expect(acmeCustomers.map((c) => c.email).sort()).toEqual(['bola@acme.test', 'chidi@acme.test', 'emeka@acme.test'])
    expect(acmeCustomers.find((c) => c.email === 'bola@acme.test')?.loanCount).toBe(3)

    const acmeRepayments = await listRepayments(acme)
    expect(acmeRepayments.length).toBeGreaterThanOrEqual(8)
    expect(acmeRepayments.every((r) => r.loanId.startsWith('loan_acme_'))).toBe(true)
    expect((await listRepayments(zenith)).every((r) => r.loanId.startsWith('loan_zenith_'))).toBe(true)

    const dates = acmeRepayments.map((r) => r.paidAt)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(acmeRepayments[0].customerName).toBe('Emeka Nwosu')

    await expect(decideLoan(acme, 'loan_zenith_1', 'approved')).rejects.toBeInstanceOf(NotFoundError)
    expect(mockLoans.find((l) => l.id === 'loan_zenith_1')?.status).toBe('pending')
  })

  it('returns copies, so callers cannot mutate stored rows', async () => {
    const token = await acmeAdmin()
    const customers = await listCustomers(token)
    customers[0].name = 'Changed'
    expect((await listCustomers(token))[0].name).not.toBe('Changed')
  })
})

describe('decideLoan', () => {
  it('moves a pending loan into the summary counts', async () => {
    const token = await acmeAdmin()
    const before = await getDashboardSummary(token)

    expect((await decideLoan(token, 'loan_acme_2', 'approved')).status).toBe('approved')
    const approved = await getDashboardSummary(token)
    expect(approved.applications).toBe(before.applications - 1)
    expect(approved.approvedLoans).toBe(before.approvedLoans + 1)
    expect(approved.outstandingMinor).toBeGreaterThan(before.outstandingMinor)

    await decideLoan(token, 'loan_acme_7', 'rejected')
    const rejected = await getDashboardSummary(token)
    expect(rejected.applications).toBe(before.applications - 2)
    expect(rejected.approvedLoans).toBe(approved.approvedLoans)
  })

  it('conflicts unless the loan is pending', async () => {
    const token = await acmeAdmin()
    await expect(decideLoan(token, 'loan_acme_1', 'rejected')).rejects.toBeInstanceOf(ConflictError)
    await expect(decideLoan(token, 'loan_acme_4', 'approved')).rejects.toBeInstanceOf(ConflictError)
    await decideLoan(token, 'loan_acme_2', 'approved')
    await expect(decideLoan(token, 'loan_acme_2', 'rejected')).rejects.toBeInstanceOf(ConflictError)
  })
})

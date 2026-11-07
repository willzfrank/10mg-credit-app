import { ForbiddenError, UnauthorizedError } from '../shared/api/errors'
import type { Role, Session } from '../shared/auth/authStore'
import { loadDb, clearDb } from './persist'
import { mockTenants, resetTenants } from './tenants'

interface MockUser {
  id: string
  tenantId: string
  tenantSlug: string
  name: string
  email: string
  password: string
  role: Role
}

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'repaid'

export interface MockLoan {
  id: string
  tenantId: string
  tenantSlug: string
  userId: string
  amountMinor: number
  tenorMonths: number
  ratePct: number
  status: LoanStatus
  createdAt: string
  idempotencyKey?: string
}

export interface MockRepayment {
  id: string
  tenantId: string
  loanId: string
  amountMinor: number
  paidAt: string
}

const tenantIdOf = (slug: string) => mockTenants[slug].id

const seedUser = (id: string, tenantSlug: string, name: string, email: string, role: Role): MockUser => ({
  id,
  tenantId: tenantIdOf(tenantSlug),
  tenantSlug,
  name,
  email,
  password: 'password123',
  role,
})

export const mockUsers: MockUser[] = [
  seedUser('u_acme_lender', 'acme', 'Ada Obi', 'ada@acme.test', 'lender_admin'),
  seedUser('u_acme_customer', 'acme', 'Chidi Eze', 'chidi@acme.test', 'customer'),
  seedUser('u_acme_other', 'acme', 'Bola Ade', 'bola@acme.test', 'customer'),
  seedUser('u_acme_emeka', 'acme', 'Emeka Nwosu', 'emeka@acme.test', 'customer'),
  seedUser('u_zenith_lender', 'zenith', 'Zed Park', 'zed@zenith.test', 'lender_admin'),
  seedUser('u_zenith_customer', 'zenith', 'Zoe Lin', 'zoe@zenith.test', 'customer'),
  seedUser('u_zenith_ravi', 'zenith', 'Ravi Shah', 'ravi@zenith.test', 'customer'),
  seedUser('u_zenith_mina', 'zenith', 'Mina Cole', 'mina@zenith.test', 'customer'),
] 

const loan = (
  id: string,
  tenantSlug: string,
  userId: string,
  amountMajor: number,
  tenorMonths: number,
  status: LoanStatus,
  createdAt: string,
): MockLoan => ({
  id,
  tenantId: tenantIdOf(tenantSlug),
  tenantSlug,
  userId,
  amountMinor: Math.round(amountMajor * 100),
  tenorMonths,
  ratePct: mockTenants[tenantSlug].settings.interestRate,
  status,
  createdAt,
})

const seedLoans: MockLoan[] = [
  loan('loan_acme_1', 'acme', 'u_acme_customer', 150000, 12, 'approved', '2026-01-10T09:00:00.000Z'),
  loan('loan_acme_2', 'acme', 'u_acme_other', 80000, 6, 'pending', '2026-10-20T09:00:00.000Z'),
  loan('loan_acme_3', 'acme', 'u_acme_other', 200000, 9, 'approved', '2026-02-14T09:00:00.000Z'),
  loan('loan_acme_4', 'acme', 'u_acme_other', 60000, 3, 'rejected', '2026-03-01T09:00:00.000Z'),
  loan('loan_acme_5', 'acme', 'u_acme_emeka', 100000, 6, 'repaid', '2025-11-05T09:00:00.000Z'),
  loan('loan_acme_6', 'acme', 'u_acme_emeka', 300000, 12, 'approved', '2026-04-18T09:00:00.000Z'),
  loan('loan_acme_7', 'acme', 'u_acme_emeka', 120000, 6, 'pending', '2026-10-28T09:00:00.000Z'),
  loan('loan_zenith_1', 'zenith', 'u_zenith_customer', 4200, 12, 'pending', '2026-10-25T09:00:00.000Z'),
  loan('loan_zenith_2', 'zenith', 'u_zenith_customer', 3000, 6, 'approved', '2026-02-02T09:00:00.000Z'),
  loan('loan_zenith_3', 'zenith', 'u_zenith_ravi', 10000, 12, 'approved', '2026-03-12T09:00:00.000Z'),
  loan('loan_zenith_4', 'zenith', 'u_zenith_ravi', 1500, 3, 'rejected', '2026-04-04T09:00:00.000Z'),
  loan('loan_zenith_5', 'zenith', 'u_zenith_mina', 800, 3, 'repaid', '2025-12-01T09:00:00.000Z'),
  loan('loan_zenith_6', 'zenith', 'u_zenith_mina', 5000, 12, 'approved', '2026-05-09T09:00:00.000Z'),
  loan('loan_zenith_7', 'zenith', 'u_zenith_ravi', 2500, 6, 'pending', '2026-10-30T09:00:00.000Z'),
]

export const mockLoans: MockLoan[] = structuredClone(seedLoans)

const repayment = (tenantSlug: string, loanId: string, n: number, amountMinor: number, paidAt: string): MockRepayment => ({
  id: `rep_${loanId}_${n}`,
  tenantId: tenantIdOf(tenantSlug),
  loanId,
  amountMinor,
  paidAt,
})

const seedRepayments: MockRepayment[] = [
  repayment('acme', 'loan_acme_1', 1, 1_000_000, '2026-02-10T10:00:00.000Z'),
  repayment('acme', 'loan_acme_1', 2, 1_000_000, '2026-03-10T10:00:00.000Z'),
  repayment('acme', 'loan_acme_1', 3, 1_000_000, '2026-04-10T10:00:00.000Z'),
  repayment('acme', 'loan_acme_1', 4, 1_000_000, '2026-05-10T10:00:00.000Z'),
  repayment('acme', 'loan_acme_3', 1, 2_500_000, '2026-03-14T10:00:00.000Z'),
  repayment('acme', 'loan_acme_3', 2, 2_500_000, '2026-04-14T10:00:00.000Z'),
  repayment('acme', 'loan_acme_6', 1, 3_000_000, '2026-05-18T10:00:00.000Z'),
  repayment('acme', 'loan_acme_6', 2, 3_000_000, '2026-06-18T10:00:00.000Z'),
  repayment('acme', 'loan_acme_5', 1, 5_000_000, '2025-12-05T10:00:00.000Z'),
  repayment('acme', 'loan_acme_5', 2, 5_225_000, '2026-01-05T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_2', 1, 20_000, '2026-03-02T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_2', 2, 20_000, '2026-04-02T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_2', 3, 20_000, '2026-05-02T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_3', 1, 80_000, '2026-04-12T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_3', 2, 80_000, '2026-05-12T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_3', 3, 80_000, '2026-06-12T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_6', 1, 40_000, '2026-06-09T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_6', 2, 40_000, '2026-07-09T10:00:00.000Z'),
  repayment('zenith', 'loan_zenith_5', 1, 81_600, '2026-01-01T10:00:00.000Z'),
]

export const mockRepayments: MockRepayment[] = structuredClone(seedRepayments)

export interface TokenOwner {
  tenantSlug: string
  userId: string
  role: Role
}

const TOKENS_KEY = 'mock-db:tokens'

function loadTokens(): Map<string, TokenOwner> {
  try {
    return new Map(JSON.parse(sessionStorage.getItem(TOKENS_KEY) ?? '[]') as [string, TokenOwner][])
  } catch {
    return new Map()
  }
}

function persistTokens() {
  try {
    sessionStorage.setItem(TOKENS_KEY, JSON.stringify([...tokens]))
  } catch {
    return
  }
}

const tokens = loadTokens()

function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const toPublicUser = ({ id, name, email, role }: MockUser) => ({ id, name, email, role })

export function authenticateCredentials(slug: string, credentials: { email: string; password: string }): Session {
  const user = mockUsers.find(
    (u) => u.tenantSlug === slug && u.email === credentials.email && u.password === credentials.password,
  )
  if (!user) throw new UnauthorizedError('Invalid email or password')

  const accessToken = `at_${randomId()}`
  tokens.set(accessToken, { tenantSlug: user.tenantSlug, userId: user.id, role: user.role })
  persistTokens()
  return { accessToken, user: toPublicUser(user) }
}

export function authenticateToken(token: string): TokenOwner {
  const owner = tokens.get(token)
  if (!owner) throw new UnauthorizedError()
  return owner
}

export function requireLenderAdmin(token: string, tenantSlug: string): TokenOwner {
  const owner = authenticateToken(token)
  if (owner.role !== 'lender_admin' || owner.tenantSlug !== tenantSlug) {
    throw new ForbiddenError('Lender admin access to this tenant required')
  }
  return owner
}

export function revokeToken(token: string) {
  tokens.delete(token)
  persistTokens()
}

export function resetDb() {
  clearDb()
  mockLoans.splice(0, mockLoans.length, ...structuredClone(seedLoans))
  mockRepayments.splice(0, mockRepayments.length, ...structuredClone(seedRepayments))
  tokens.clear()
  persistTokens()
  resetTenants()
}

loadDb()

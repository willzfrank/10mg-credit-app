import { UnauthorizedError } from '../shared/api/errors'
import type { Role, Session } from '../shared/auth/authStore'
import { resetTenants } from './tenants'

interface MockUser {
  id: string
  tenantSlug: string
  name: string
  email: string
  password: string
  role: Role
}

export interface MockLoan {
  id: string
  tenantSlug: string
  userId: string
  amount: number
  status: 'pending' | 'approved' | 'repaid'
}

export interface MockApplication {
  id: string
  tenantSlug: string
  userId: string
  amount: number
  tenorMonths: number
  status: 'pending'
  idempotencyKey: string
}

const users: MockUser[] = [
  { id: 'u_acme_lender', tenantSlug: 'acme', name: 'Ada Obi', email: 'ada@acme.test', password: 'password123', role: 'lender_admin' },
  { id: 'u_acme_customer', tenantSlug: 'acme', name: 'Chidi Eze', email: 'chidi@acme.test', password: 'password123', role: 'customer' },
  { id: 'u_zenith_lender', tenantSlug: 'zenith', name: 'Zed Park', email: 'zed@zenith.test', password: 'password123', role: 'lender_admin' },
  { id: 'u_zenith_customer', tenantSlug: 'zenith', name: 'Zoe Lin', email: 'zoe@zenith.test', password: 'password123', role: 'customer' },
]

const seedLoans: MockLoan[] = [
  { id: 'loan_acme_1', tenantSlug: 'acme', userId: 'u_acme_customer', amount: 150000, status: 'approved' },
  { id: 'loan_acme_2', tenantSlug: 'acme', userId: 'u_acme_other', amount: 80000, status: 'pending' },
  { id: 'loan_zenith_1', tenantSlug: 'zenith', userId: 'u_zenith_customer', amount: 4200, status: 'pending' },
]

export const mockLoans: MockLoan[] = structuredClone(seedLoans)

export const mockApplications: MockApplication[] = []

export interface TokenOwner {
  tenantSlug: string
  userId: string
  role: Role
}

// Mock-only: tokens are mirrored to sessionStorage so a persisted client session still validates after a reload.
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
    // storage unavailable: tokens stay in memory only
  }
}

const tokens = loadTokens()

function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const toPublicUser = ({ id, name, email, role }: MockUser) => ({ id, name, email, role })

export function authenticateCredentials(slug: string, credentials: { email: string; password: string }): Session {
  const user = users.find(
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

export function revokeToken(token: string) {
  tokens.delete(token)
  persistTokens()
}

export function resetDb() {
  mockLoans.splice(0, mockLoans.length, ...structuredClone(seedLoans))
  mockApplications.length = 0
  tokens.clear()
  persistTokens()
  resetTenants()
}

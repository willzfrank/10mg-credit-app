import { authenticateToken, mockApplications, mockLoans, type MockApplication, type MockLoan, type TokenOwner } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { mockTenants } from '../../mocks/tenants'
import { ConflictError, NotFoundError, ValidationError } from '../../shared/api/errors'

export interface ApplicationInput {
  amount: number
  tenorMonths: number
  idempotencyKey: string
}

function canSee(owner: TokenOwner, loan: MockLoan): boolean {
  return loan.tenantSlug === owner.tenantSlug && (owner.role === 'lender_admin' || loan.userId === owner.userId)
}

export async function getLoan(token: string, loanId: string): Promise<MockLoan> {
  await delay()
  const owner = authenticateToken(token)
  const loan = mockLoans.find((l) => l.id === loanId)
  if (!loan || !canSee(owner, loan)) throw new NotFoundError()
  return structuredClone(loan)
}

export async function listLoans(token: string): Promise<MockLoan[]> {
  await delay()
  const owner = authenticateToken(token)
  return mockLoans.filter((loan) => canSee(owner, loan)).map((loan) => structuredClone(loan))
}

export async function submitApplication(token: string, input: ApplicationInput): Promise<MockApplication> {
  await delay()
  const owner = authenticateToken(token)

  const { minLoanAmount, maxLoanAmount, maxTenorMonths } = mockTenants[owner.tenantSlug].settings
  if (!Number.isFinite(input.amount) || input.amount < minLoanAmount || input.amount > maxLoanAmount) {
    throw new ValidationError(`Amount must be between ${minLoanAmount} and ${maxLoanAmount}`)
  }
  if (!Number.isInteger(input.tenorMonths) || input.tenorMonths < 1 || input.tenorMonths > maxTenorMonths) {
    throw new ValidationError(`Tenor must be between 1 and ${maxTenorMonths} months`)
  }

  const existing = mockApplications.find(
    (a) => a.tenantSlug === owner.tenantSlug && a.userId === owner.userId && a.idempotencyKey === input.idempotencyKey,
  )
  if (existing) {
    if (existing.amount !== input.amount || existing.tenorMonths !== input.tenorMonths) {
      throw new ConflictError('Idempotency key was already used with a different request')
    }
    return structuredClone(existing)
  }

  const application: MockApplication = {
    id: `app_${mockApplications.length + 1}`,
    tenantSlug: owner.tenantSlug,
    userId: owner.userId,
    amount: input.amount,
    tenorMonths: input.tenorMonths,
    status: 'pending',
    idempotencyKey: input.idempotencyKey,
  }
  mockApplications.push(application)
  return structuredClone(application)
}

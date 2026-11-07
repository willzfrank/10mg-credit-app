import { authenticateToken, mockLoans, mockRepayments, type MockLoan, type MockRepayment, type TokenOwner } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { saveDb } from '../../mocks/persist'
import { mockTenants } from '../../mocks/tenants'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/api/errors'
import { outstandingMinor } from './money'

export interface ApplicationInput {
  amountMinor: number
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

export async function listLoanRepayments(token: string, loanId: string): Promise<MockRepayment[]> {
  await delay()
  const owner = authenticateToken(token)
  const loan = mockLoans.find((l) => l.id === loanId)
  if (!loan || !canSee(owner, loan)) throw new NotFoundError()
  return mockRepayments
    .filter((r) => r.tenantId === loan.tenantId && r.loanId === loan.id)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    .map((r) => structuredClone(r))
}

export async function listLoans(token: string): Promise<MockLoan[]> {
  await delay()
  const owner = authenticateToken(token)
  return mockLoans.filter((loan) => canSee(owner, loan)).map((loan) => structuredClone(loan))
}

export interface RepaymentInput {
  amountMinor: number
}

export async function makeRepayment(token: string, loanId: string, input: RepaymentInput): Promise<MockRepayment> {
  await delay()
  const owner = authenticateToken(token)
  if (owner.role !== 'customer') throw new ForbiddenError('Only the borrower can make a repayment')
  const loan = mockLoans.find((l) => l.id === loanId)
  if (!loan || !canSee(owner, loan)) throw new NotFoundError()
  if (loan.status !== 'approved') throw new ConflictError(`Loan is ${loan.status}, so it cannot be repaid`)

  const { amountMinor } = input
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new ValidationError('Amount must be a positive whole number of minor units')
  }
  const loanRepayments = mockRepayments.filter((r) => r.tenantId === loan.tenantId && r.loanId === loan.id)
  const outstanding = outstandingMinor(loan, loanRepayments)
  if (amountMinor > outstanding) throw new ValidationError('Amount is more than the outstanding balance')

  const repayment: MockRepayment = {
    id: `rep_${loan.id}_${loanRepayments.length + 1}`,
    tenantId: loan.tenantId,
    loanId: loan.id,
    amountMinor,
    paidAt: new Date().toISOString(),
  }
  mockRepayments.push(repayment)
  if (amountMinor === outstanding) loan.status = 'repaid'
  saveDb()
  return structuredClone(repayment)
}

export async function submitApplication(token: string, input: ApplicationInput): Promise<MockLoan> {
  await delay()
  const owner = authenticateToken(token)

  const tenant = mockTenants[owner.tenantSlug]
  const { minLoanAmount, maxLoanAmount, maxTenorMonths, interestRate } = tenant.settings
  const { amountMinor } = input
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new ValidationError('Amount must be a positive whole number of minor units')
  }
  if (amountMinor < Math.round(minLoanAmount * 100) || amountMinor > Math.round(maxLoanAmount * 100)) {
    throw new ValidationError(`Amount must be between ${minLoanAmount} and ${maxLoanAmount}`)
  }
  if (!Number.isInteger(input.tenorMonths) || input.tenorMonths < 1 || input.tenorMonths > maxTenorMonths) {
    throw new ValidationError(`Tenor must be between 1 and ${maxTenorMonths} months`)
  }

  const existing = mockLoans.find(
    (l) => l.tenantId === tenant.id && l.userId === owner.userId && l.idempotencyKey === input.idempotencyKey,
  )
  if (existing) {
    if (existing.amountMinor !== amountMinor || existing.tenorMonths !== input.tenorMonths) {
      throw new ConflictError('Idempotency key was already used with a different request')
    }
    return structuredClone(existing)
  }

  const application: MockLoan = {
    id: `loan_${owner.tenantSlug}_${mockLoans.filter((l) => l.tenantId === tenant.id).length + 1}`,
    tenantId: tenant.id,
    tenantSlug: owner.tenantSlug,
    userId: owner.userId,
    amountMinor,
    tenorMonths: input.tenorMonths,
    ratePct: interestRate,
    status: 'pending',
    createdAt: new Date().toISOString(),
    idempotencyKey: input.idempotencyKey,
  }
  mockLoans.push(application)
  saveDb()
  return structuredClone(application)
}

import { authenticateToken, mockLoans, mockRepayments, mockUsers, type MockLoan, type TokenOwner } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { mockTenants } from '../../mocks/tenants'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/api/errors'
import { outstandingMinor } from '../loans/money'

interface DashboardSummary {
  /** Applications awaiting a decision (loans with status 'pending'). */
  applications: number
  customers: number
  approvedLoans: number
  outstandingMinor: number
}

interface CustomerRow {
  id: string
  name: string
  email: string
  loanCount: number
}

interface RepaymentRow {
  id: string
  loanId: string
  customerName: string
  amountMinor: number
  paidAt: string
}

function requireAdmin(token: string): { owner: TokenOwner; tenantId: string } {
  const owner = authenticateToken(token)
  if (owner.role !== 'lender_admin') throw new ForbiddenError('Lender admin access required')
  return { owner, tenantId: mockTenants[owner.tenantSlug].id }
}

const tenantLoans = (tenantId: string) => mockLoans.filter((l) => l.tenantId === tenantId)
const nameOf = (userId: string) => mockUsers.find((u) => u.id === userId)?.name ?? 'Unknown customer'

export async function getDashboardSummary(token: string): Promise<DashboardSummary> {
  await delay()
  const { tenantId } = requireAdmin(token)
  const loans = tenantLoans(tenantId)
  const approved = loans.filter((l) => l.status === 'approved')
  const outstanding = approved.reduce((sum, loan) => {
    const paid = mockRepayments.filter((r) => r.tenantId === tenantId && r.loanId === loan.id)
    return sum + outstandingMinor(loan, paid)
  }, 0)
  return structuredClone({
    applications: loans.filter((l) => l.status === 'pending').length,
    customers: mockUsers.filter((u) => u.tenantId === tenantId && u.role === 'customer').length,
    approvedLoans: approved.length,
    outstandingMinor: outstanding,
  })
}

export async function listCustomers(token: string): Promise<CustomerRow[]> {
  await delay()
  const { tenantId } = requireAdmin(token)
  const loans = tenantLoans(tenantId)
  return structuredClone(
    mockUsers
      .filter((u) => u.tenantId === tenantId && u.role === 'customer')
      .map(({ id, name, email }) => ({ id, name, email, loanCount: loans.filter((l) => l.userId === id).length })),
  )
}

export async function listRepayments(token: string): Promise<RepaymentRow[]> {
  await delay()
  const { tenantId } = requireAdmin(token)
  const loans = tenantLoans(tenantId)
  return structuredClone(
    mockRepayments
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
      .map((r) => ({
        id: r.id,
        loanId: r.loanId,
        customerName: nameOf(loans.find((l) => l.id === r.loanId)?.userId ?? ''),
        amountMinor: r.amountMinor,
        paidAt: r.paidAt,
      })),
  )
}

export async function decideLoan(token: string, loanId: string, decision: 'approved' | 'rejected'): Promise<MockLoan> {
  await delay()
  const { tenantId } = requireAdmin(token)
  if (decision !== 'approved' && decision !== 'rejected') throw new ValidationError('Decision must be approved or rejected')
  const loan = tenantLoans(tenantId).find((l) => l.id === loanId)
  if (!loan) throw new NotFoundError()
  if (loan.status !== 'pending') throw new ConflictError(`Loan is already ${loan.status}`)
  loan.status = decision
  return structuredClone(loan)
}

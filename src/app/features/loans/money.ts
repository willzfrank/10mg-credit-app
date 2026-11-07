import type { MockLoan, MockRepayment } from '../../mocks/db'

export function totalPayableMinor(loan: Pick<MockLoan, 'amountMinor' | 'ratePct' | 'tenorMonths'>): number {
  const principal = loan.amountMinor
  return principal + Math.round(((principal * loan.ratePct) / 100) * loan.tenorMonths / 12)
}

export function outstandingMinor(
  loan: Pick<MockLoan, 'amountMinor' | 'ratePct' | 'tenorMonths'>,
  repayments: Pick<MockRepayment, 'amountMinor'>[],
): number {
  const paid = repayments.reduce((sum, r) => sum + r.amountMinor, 0)
  return Math.max(0, totalPayableMinor(loan) - paid)
}

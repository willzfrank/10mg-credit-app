import type { MockLoan, MockRepayment } from '../../mocks/db'

/** All money is integer minor units (kobo / cents). Rate is an annual percentage. */
export function totalPayableMinor(loan: Pick<MockLoan, 'amountMinor' | 'ratePct' | 'tenorMonths'>): number {
  const principal = loan.amountMinor
  return principal + Math.round(((principal * loan.ratePct) / 100) * loan.tenorMonths / 12)
}

/** Computed, never stored. */
export function outstandingMinor(
  loan: Pick<MockLoan, 'amountMinor' | 'ratePct' | 'tenorMonths'>,
  repayments: Pick<MockRepayment, 'amountMinor'>[],
): number {
  const paid = repayments.reduce((sum, r) => sum + r.amountMinor, 0)
  return Math.max(0, totalPayableMinor(loan) - paid)
}

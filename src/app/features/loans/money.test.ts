import { describe, expect, it } from 'vitest'
import { outstandingMinor, totalPayableMinor } from './money'

const loan = { amountMinor: 15_000_000, ratePct: 4.5, tenorMonths: 12 }

describe('loan money', () => {
  it('adds simple annual interest, pro-rated by tenor and rounded to a whole minor unit', () => {
    expect(totalPayableMinor(loan)).toBe(15_675_000)
    expect(totalPayableMinor({ amountMinor: 6_000_000, ratePct: 4.5, tenorMonths: 3 })).toBe(6_067_500)
    expect(Number.isInteger(totalPayableMinor({ amountMinor: 33_333, ratePct: 7.3, tenorMonths: 5 }))).toBe(true)
  })

  it('computes outstanding as total payable minus repayments, never below zero', () => {
    const paid = [{ amountMinor: 1_000_000 }, { amountMinor: 1_000_000 }, { amountMinor: 1_000_000 }, { amountMinor: 1_000_000 }]
    expect(outstandingMinor(loan, [])).toBe(15_675_000)
    expect(outstandingMinor(loan, paid)).toBe(11_675_000)
    expect(outstandingMinor(loan, [{ amountMinor: 20_000_000 }])).toBe(0)
  })
})

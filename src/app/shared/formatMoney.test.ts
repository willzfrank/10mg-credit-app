import { describe, expect, it } from 'vitest'
import { formatMoney } from './formatMoney'

describe('formatMoney', () => {
  it('formats minor units for each tenant currency and locale without throwing', () => {
    expect(formatMoney(15_675_000, 'NGN', 'en-NG')).toBe('₦156,750.00')
    expect(formatMoney(420_000, 'USD', 'en-US')).toBe('$4,200.00')
    expect(formatMoney(0, 'USD', 'en-US')).toBe('$0.00')
    expect(formatMoney(5, 'USD', 'en-US')).toBe('$0.05')
    // Well-formed but unsupported locales fall back instead of throwing.
    expect(() => formatMoney(100, 'USD', 'xx-YY')).not.toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import { mockLoans, mockRepayments, resetDb } from './db'
import { loadDb, saveDb } from './persist'
import { mockTenants } from './tenants'

describe('persist', () => {
  it('round-trips loans, repayments and tenants in place', () => {
    const loansRef = mockLoans
    mockLoans[0].status = 'rejected'
    mockRepayments.pop()
    mockTenants.acme.name = 'Renamed'
    const expected = structuredClone({ loans: mockLoans, repayments: mockRepayments, tenants: mockTenants })
    saveDb()

    mockLoans.length = 0
    mockRepayments.length = 0
    mockTenants.acme.name = 'Other'

    expect(loadDb()).toBe(true)
    expect(mockLoans).toBe(loansRef)
    expect({ loans: mockLoans, repayments: mockRepayments, tenants: mockTenants }).toEqual(expected)
  })

  it('keeps the seed when the payload is corrupt or the wrong version', () => {
    const seed = structuredClone(mockLoans)
    for (const raw of ['{not json', JSON.stringify({ version: 99, loans: [], repayments: [], tenants: {} })]) {
      localStorage.setItem('10mg:db:v1', raw)
      expect(loadDb()).toBe(false)
      expect(mockLoans).toEqual(seed)
    }
    resetDb()
    expect(localStorage.getItem('10mg:db:v1')).toBeNull()
  })
})

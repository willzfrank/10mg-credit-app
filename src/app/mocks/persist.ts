import { mockLoans, mockRepayments } from './db'
import { mockTenants } from './tenants'

// Functions (not top-level consts) because db.ts and this module import each other.
const storageKey = () => '10mg:db:v1'
const schemaVersion = () => 1

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function clearDb() {
  try {
    localStorage.removeItem(storageKey())
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

/** Hydrates the mock collections in place from storage. Returns false (leaving the seed untouched) on any problem. */
export function loadDb(): boolean {
  try {
    const raw = localStorage.getItem(storageKey())
    if (raw === null) return false
    const data: unknown = JSON.parse(raw)
    if (!isObject(data) || data.version !== schemaVersion()) return false
    const { loans, repayments, tenants } = data
    if (!Array.isArray(loans) || !Array.isArray(repayments) || !isObject(tenants)) return false
    if (![...loans, ...repayments, ...Object.values(tenants)].every(isObject)) return false

    mockLoans.splice(0, mockLoans.length, ...(loans as typeof mockLoans))
    mockRepayments.splice(0, mockRepayments.length, ...(repayments as typeof mockRepayments))
    for (const slug of Object.keys(mockTenants)) delete mockTenants[slug]
    Object.assign(mockTenants, tenants)
    return true
  } catch {
    return false
  }
}

export function saveDb() {
  try {
    localStorage.setItem(
      storageKey(),
      JSON.stringify({ version: schemaVersion(), loans: mockLoans, repayments: mockRepayments, tenants: mockTenants }),
    )
  } catch {
    // Quota exceeded or storage disabled: the in-memory db stays authoritative.
  }
}

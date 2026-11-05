import { describe, expect, it } from 'vitest'
import { DEFAULT_TENANT, resolveTenantSlug } from './resolveTenantSlug'

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial))
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) }
}

const at = (hostname: string, search = '', baseDomain: string | undefined = '10mg.com', storage = memoryStorage()) =>
  resolveTenantSlug({ hostname, search }, baseDomain, storage)

describe('resolveTenantSlug', () => {
  it('prefers ?tenant=, then the subdomain of the base domain, then the default', () => {
    expect(at('acme.10mg.com', '?tenant=zenith')).toBe('zenith')
    expect(at('acme.10mg.com')).toBe('acme')
    expect(at('acme.10mg.com', '?tenant=Bad_Slug!')).toBe('acme')
    expect(at('10mg.com')).toBe(DEFAULT_TENANT)
    expect(at('acme.other.com')).toBe(DEFAULT_TENANT)
    expect(at('a.b.10mg.com')).toBe(DEFAULT_TENANT)
    expect(at('acme.10mg.com', '', undefined)).toBe(DEFAULT_TENANT)
  })

  it('remembers an explicit slug in sessionStorage and reuses it when none is present', () => {
    const storage = memoryStorage()
    expect(at('localhost', '?tenant=zenith', undefined, storage)).toBe('zenith')
    expect(at('localhost', '', undefined, storage)).toBe('zenith')
    expect(at('acme.10mg.com', '', '10mg.com', storage)).toBe('acme')
    expect(at('localhost', '', undefined, memoryStorage({ 'tenant-slug': 'Bad_Slug!' }))).toBe(DEFAULT_TENANT)
  })
})

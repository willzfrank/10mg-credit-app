import { describe, expect, it } from 'vitest'
import { getPrimaryContrastWarning, MAX_LOGO_BYTES, tenantConfigFormSchema } from './configFormSchema'
import { contrastRatio, getReadableForeground } from './getReadableForeground'
import { mockTenants } from '../../mocks/tenants'

const base = mockTenants.acme
const form = (overrides: Record<string, unknown> = {}) => ({
  name: base.name,
  logoUrl: base.logoUrl,
  colors: {},
  settings: base.settings,
  ...overrides,
})
const withSettings = (settings: Record<string, unknown>) => form({ settings: { ...base.settings, ...settings } })

describe('contrast', () => {
  it('computes WCAG ratios and picks a readable foreground', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(getReadableForeground('#0f766e')).toBe('#ffffff')
    expect(getReadableForeground('#fde047')).toBe('#0a0a0a')
  })
})

describe('tenantConfigFormSchema', () => {
  it('warns but does not block low-contrast primaries, and rejects unknown keys and bad hex', () => {
    expect(tenantConfigFormSchema.safeParse(form({ colors: { primary: '#fde047' } })).success).toBe(true)
    expect(getPrimaryContrastWarning('#fde047')).toMatch(/Contrast against white/)
    expect(getPrimaryContrastWarning('#0f766e')).toBeNull()

    expect(tenantConfigFormSchema.safeParse(form({ colors: { destructive: '#ff0000' } })).success).toBe(false)
    expect(tenantConfigFormSchema.safeParse(form({ colors: { primary: 'teal' } })).success).toBe(false)
  })

  it('validates name, currency, locale and the loan range', () => {
    expect(tenantConfigFormSchema.safeParse(form()).success).toBe(true)
    expect(tenantConfigFormSchema.safeParse(form({ name: '   ' })).success).toBe(false)
    expect(tenantConfigFormSchema.parse(form({ name: '  Acme  ' })).name).toBe('Acme')
    expect(tenantConfigFormSchema.safeParse(withSettings({ currency: 'EUR' })).success).toBe(false)
    expect(tenantConfigFormSchema.safeParse(withSettings({ locale: 'en_NG' })).success).toBe(false)
    expect(tenantConfigFormSchema.safeParse(withSettings({ minLoanAmount: 100, maxLoanAmount: 50 })).success).toBe(false)
    expect(tenantConfigFormSchema.safeParse(withSettings({ minLoanAmount: 100, maxLoanAmount: 100 })).success).toBe(true)
  })
})

describe('logo validation', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo='
  it('accepts http(s) URLs, root paths and small image data URLs', () => {
    for (const logoUrl of ['https://x.test/logo.png', '/logo.svg', png]) {
      expect(tenantConfigFormSchema.safeParse(form({ logoUrl })).success).toBe(true)
    }
  })

  it('rejects protocol-relative URLs, non-image data URLs and oversized uploads', () => {
    const tooBig = `data:image/png;base64,${'A'.repeat(Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 100)}`
    for (const logoUrl of ['//evil.test/x.png', 'javascript:alert(1)', 'data:text/html;base64,PGI+', tooBig]) {
      expect(tenantConfigFormSchema.safeParse(form({ logoUrl })).success).toBe(false)
    }
  })
})

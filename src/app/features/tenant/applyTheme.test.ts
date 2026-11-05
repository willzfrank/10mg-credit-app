import { describe, expect, it } from 'vitest'
import { mockTenants } from '../../mocks/tenants'
import { applyTheme } from './applyTheme'
import type { TenantConfig } from './types'

const config = (colors: TenantConfig['colors']): TenantConfig => ({ ...mockTenants.acme, colors })

describe('applyTheme', () => {
  it('sets overridable tokens with derived foregrounds and tags the tenant', () => {
    const root = document.createElement('div')
    applyTheme(config({ primary: '#0f766e', accent: '#fde047' }), root)

    expect(root.style.getPropertyValue('--primary')).toBe('#0f766e')
    expect(root.style.getPropertyValue('--primary-foreground')).toBe('#ffffff')
    expect(root.style.getPropertyValue('--accent')).toBe('#fde047')
    expect(root.style.getPropertyValue('--accent-foreground')).toBe('#0a0a0a')
    expect(root.dataset.tenant).toBe('acme')
  })

  it('clears tokens that are no longer set and never touches platform tokens', () => {
    const root = document.createElement('div')
    root.style.setProperty('--border', 'platform-border')
    applyTheme(config({ primary: '#0f766e' }), root)
    applyTheme(config({}), root)

    expect(root.style.getPropertyValue('--primary')).toBe('')
    expect(root.style.getPropertyValue('--primary-foreground')).toBe('')
    expect(root.style.getPropertyValue('--border')).toBe('platform-border')
  })
})

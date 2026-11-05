import { getReadableForeground } from './getReadableForeground'
import type { TenantColors, TenantConfig } from './types'

const OVERRIDABLE_TOKENS = ['primary', 'secondary', 'accent'] as const satisfies readonly (keyof TenantColors)[]

export function applyTheme(config: TenantConfig, root: HTMLElement = document.documentElement) {
  for (const token of OVERRIDABLE_TOKENS) {
    const value = config.colors[token]
    if (value) {
      root.style.setProperty(`--${token}`, value)
      root.style.setProperty(`--${token}-foreground`, getReadableForeground(value))
    } else {
      root.style.removeProperty(`--${token}`)
      root.style.removeProperty(`--${token}-foreground`)
    }
  }
  root.dataset.tenant = config.slug
}

import { z } from 'zod'
import { contrastRatio, WCAG_TEXT_CONTRAST } from './getReadableForeground'
import { tenantColorFields, tenantName, tenantSettingsFormSchema } from './types'

const PAGE_BACKGROUND = '#ffffff'

function isLogoUrl(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export const tenantConfigFormSchema = z.strictObject({
  name: tenantName,
  logoUrl: z
    .string()
    .trim()
    .min(1, 'Logo is required')
    .refine(isLogoUrl, 'Use an http(s) URL or a path starting with /'),
  colors: z.strictObject(tenantColorFields),
  settings: tenantSettingsFormSchema,
})

export type TenantConfigForm = z.infer<typeof tenantConfigFormSchema>

export function getPrimaryContrastWarning(primary: string | undefined): string | null {
  if (!primary) return null
  const ratio = contrastRatio(primary, PAGE_BACKGROUND)
  if (ratio >= WCAG_TEXT_CONTRAST) return null
  return `Contrast against white is ${ratio.toFixed(1)}:1. Links and icons in this color may be hard to read (recommended ${WCAG_TEXT_CONTRAST}:1).`
}

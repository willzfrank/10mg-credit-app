import { z } from 'zod'
import { contrastRatio, WCAG_TEXT_CONTRAST } from './getReadableForeground'
import { tenantColorFields, tenantName, tenantSettingsFormSchema } from './types'

const PAGE_BACKGROUND = '#ffffff'

export const tenantConfigFormSchema = z.strictObject({
  name: tenantName,
  logoUrl: z.string().min(1, 'Logo is required'),
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

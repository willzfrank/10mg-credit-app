import { z } from 'zod'
import { contrastRatio, WCAG_TEXT_CONTRAST } from './getReadableForeground'
import { tenantColorFields, tenantName, tenantSettingsFormSchema } from './types'

const PAGE_BACKGROUND = '#ffffff'

/** Uploaded logos are stored as data URLs; cap the encoded size so the mock store stays small. */
export const MAX_LOGO_BYTES = 200 * 1024
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[a-z0-9+/]+=*$/i

function isLogoUrl(value: string): boolean {
  if (value.startsWith('data:')) return LOGO_DATA_URL.test(value) && value.length <= Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 64
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
    .refine(isLogoUrl, 'Use an http(s) URL, a path starting with /, or upload an image (max 200 KB)'),
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

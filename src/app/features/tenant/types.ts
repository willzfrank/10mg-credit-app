import { z } from 'zod'

export const tenantSlugSchema = z.string().min(1).max(63).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)

export const hexColor = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Invalid hex color')

export const tenantName = z.string().trim().min(1, 'Name is required')

export const tenantColorFields = {
  primary: hexColor.optional(),
  secondary: hexColor.optional(),
  accent: hexColor.optional(),
}

const finiteNumber = () => z.number({ error: 'Enter a number' })

const tenantSettingsFields = {
  currency: z.enum(['NGN', 'USD']),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Use a locale like en-NG'),
  minLoanAmount: finiteNumber().positive(),
  maxLoanAmount: finiteNumber().positive(),
  interestRate: finiteNumber().min(0).max(100),
  maxTenorMonths: finiteNumber().int().positive(),
}

const loanRangeCheck = (settings: { minLoanAmount: number; maxLoanAmount: number }) =>
  settings.minLoanAmount <= settings.maxLoanAmount

const loanRangeError = {
  path: ['maxLoanAmount'],
  message: 'Maximum loan amount must be at least the minimum',
}

const tenantSettingsSchema = z.object(tenantSettingsFields).refine(loanRangeCheck, loanRangeError)
export const tenantSettingsFormSchema = z.strictObject(tenantSettingsFields).refine(loanRangeCheck, loanRangeError)

export const tenantConfigSchema = z.object({
  id: z.string().min(1),
  slug: tenantSlugSchema,
  name: tenantName,
  logoUrl: z.string().min(1),
  colors: z.object(tenantColorFields),
  settings: tenantSettingsSchema,
})

export type TenantColors = z.infer<typeof tenantConfigSchema>['colors']
export type TenantSettings = z.infer<typeof tenantConfigSchema>['settings']
export type TenantConfig = z.infer<typeof tenantConfigSchema>

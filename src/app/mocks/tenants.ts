import type { TenantConfig } from '../features/tenant/types'

const seedTenants: Record<string, TenantConfig> = {
  acme: {
    id: 'tnt_001',
    slug: 'acme',
    name: 'Acme Microfinance',
    logoUrl: '/logos/acme.svg',
    colors: {},
    settings: {
      currency: 'NGN',
      locale: 'en-NG',
      minLoanAmount: 50000,
      maxLoanAmount: 5000000,
      interestRate: 4.5,
      maxTenorMonths: 12,
    },
  },
  zenith: {
    id: 'tnt_002',
    slug: 'zenith',
    name: 'Zenith Credit',
    logoUrl: '/logos/zenith.svg',
    colors: {},
    settings: {
      currency: 'USD',
      locale: 'en-US',
      minLoanAmount: 500,
      maxLoanAmount: 25000,
      interestRate: 8,
      maxTenorMonths: 36,
    },
  },
}

export const mockTenants: Record<string, TenantConfig> = structuredClone(seedTenants)

export function resetTenants() {
  for (const slug of Object.keys(mockTenants)) delete mockTenants[slug]
  Object.assign(mockTenants, structuredClone(seedTenants))
}

import type { TenantConfig } from '../features/tenant/types'

const seedTenants: Record<string, TenantConfig> = {
  acme: {
    id: 'tnt_001',
    slug: 'acme',
    name: 'Acme Microfinance',
    logoUrl: '/logos/acme.svg',
    colors: { primary: '#0f766e', secondary: '#fcd34d', accent: '#ccfbf1' },
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
    colors: { primary: '#5b21b6', secondary: '#fb923c', accent: '#ede9fe' },
    settings: {
      currency: 'USD',
      locale: 'en-US',
      minLoanAmount: 500,
      maxLoanAmount: 25000,
      interestRate: 8,
      maxTenorMonths: 36,
    },
  },
  // health10mg: {
  //   id: 'tnt_003',
  //   slug: 'health10mg',
  //   name: '10mg health',
  //   logoUrl: '/logos/zenith.svg',
  //   colors: { primary: '#5b21b6', secondary: '#fb923c', accent: '#ede9fe' },
  //   settings: {
  //     currency: 'USD',
  //     locale: 'en-US',
  //     minLoanAmount: 500,
  //     maxLoanAmount: 25000,
  //     interestRate: 8,
  //     maxTenorMonths: 36,
  //   },
  // },
  
}

export const DEMO_TENANTS: { slug: string; name: string }[] = Object.values(seedTenants).map(({ slug, name }) => ({
  slug,
  name,
}))

export interface DemoAccount {
  role: 'lender_admin' | 'customer'
  email: string
  password: string
}

export const demoAccounts: Record<string, DemoAccount[]> = {
  acme: [
    { role: 'lender_admin', email: 'ada@acme.test', password: 'password123' },
    { role: 'customer', email: 'chidi@acme.test', password: 'password123' },
  ],
  zenith: [
    { role: 'lender_admin', email: 'zed@zenith.test', password: 'password123' },
    { role: 'customer', email: 'zoe@zenith.test', password: 'password123' },
  ],
  //  health10mg: [
  //   { role: 'lender_admin', email: 'lender@health10mg.test', password: 'password123' },
  //   { role: 'customer', email: 'customer@health10mg.test', password: 'password123' },
  // ],
}

export const mockTenants: Record<string, TenantConfig> = structuredClone(seedTenants)

export function resetTenants() {
  for (const slug of Object.keys(mockTenants)) delete mockTenants[slug]
  Object.assign(mockTenants, structuredClone(seedTenants))
}

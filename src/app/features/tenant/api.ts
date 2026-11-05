import { requireLenderAdmin } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { mockTenants } from '../../mocks/tenants'
import { NotFoundError } from '../../shared/api/errors'
import type { TenantConfigForm } from './configFormSchema'
import { tenantConfigSchema, type TenantConfig } from './types'

export async function fetchTenantConfig(slug: string): Promise<TenantConfig> {
  await delay()
  if (!Object.hasOwn(mockTenants, slug)) throw new NotFoundError(`Unknown tenant: ${slug}`)
  return tenantConfigSchema.parse(mockTenants[slug])
}

export async function updateTenantConfig(token: string, slug: string, form: TenantConfigForm): Promise<TenantConfig> {
  await delay()
  requireLenderAdmin(token, slug)
  const updated = tenantConfigSchema.parse({ ...mockTenants[slug], ...form })
  mockTenants[slug] = updated
  return structuredClone(updated)
}

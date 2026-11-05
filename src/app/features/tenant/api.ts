import { authenticateToken } from '../../mocks/db'
import { delay } from '../../mocks/delay'
import { mockTenants } from '../../mocks/tenants'
import { NotFoundError, UnauthorizedError } from '../../shared/api/errors'
import type { TenantConfigForm } from './configFormSchema'
import { tenantConfigSchema, type TenantConfig } from './types'

export async function fetchTenantConfig(slug: string): Promise<TenantConfig> {
  await delay()
  if (!Object.hasOwn(mockTenants, slug)) throw new NotFoundError(`Unknown tenant: ${slug}`)
  return tenantConfigSchema.parse(mockTenants[slug])
}

export async function updateTenantConfig(token: string, form: TenantConfigForm): Promise<TenantConfig> {
  await delay()
  const owner = authenticateToken(token)
  if (owner.role !== 'lender_admin') throw new UnauthorizedError('Lender role required')
  const updated = tenantConfigSchema.parse({ ...mockTenants[owner.tenantSlug], ...form })
  mockTenants[owner.tenantSlug] = updated
  return structuredClone(updated)
}

import { DEMO_TENANTS } from '../../mocks/tenants'
import { tenantSlugSchema } from './types'

export const DEFAULT_TENANT: string = import.meta.env.VITE_DEFAULT_TENANT ?? DEMO_TENANTS[0].slug

const BASE_DOMAIN: string | undefined = import.meta.env.VITE_BASE_DOMAIN
const STORAGE_KEY = 'tenant-slug'

type SlugStorage = Pick<Storage, 'getItem' | 'setItem'>

function getSessionStorage(): SlugStorage | undefined {
  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

function parseSlug(value: string | null | undefined): string | null {
  if (!value) return null
  const result = tenantSlugSchema.safeParse(value.toLowerCase())
  return result.success ? result.data : null
}

function subdomainOf(hostname: string, baseDomain: string | undefined): string | null {
  if (!baseDomain) return null
  const suffix = `.${baseDomain.toLowerCase()}`
  const host = hostname.toLowerCase()
  return host.endsWith(suffix) ? host.slice(0, -suffix.length) : null
}

function readStoredSlug(storage: SlugStorage | undefined): string | null {
  try {
    return parseSlug(storage?.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

function storeSlug(storage: SlugStorage | undefined, slug: string) {
  try {
    storage?.setItem(STORAGE_KEY, slug)
  } catch {
    // storage unavailable: the slug is simply not remembered
  }
}

export function resolveTenantSlug(
  location: Pick<Location, 'hostname' | 'search'> = window.location,
  baseDomain: string | undefined = BASE_DOMAIN,
  storage: SlugStorage | undefined = getSessionStorage(),
): string {
  const explicit =
    parseSlug(new URLSearchParams(location.search).get('tenant')) ??
    parseSlug(subdomainOf(location.hostname, baseDomain))

  if (explicit) {
    storeSlug(storage, explicit)
    return explicit
  }
  return readStoredSlug(storage) ?? DEFAULT_TENANT
}

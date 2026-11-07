import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { resolveTenantSlug } from '../features/tenant/resolveTenantSlug'
import { UnauthorizedError } from './api/errors'
import { logout } from './auth/authApi'
import { getSession } from './auth/authStore'

function logoutOnUnauthorized(error: unknown, meta: Record<string, unknown> | undefined) {
  if (!(error instanceof UnauthorizedError)) return
  const slug = typeof meta?.tenantSlug === 'string' ? meta.tenantSlug : resolveTenantSlug()
  if (getSession(slug)) void logout(slug)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.queryKey[0] === 'tenant') return
      logoutOnUnauthorized(error, query.meta)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => logoutOnUnauthorized(error, mutation.meta),
  }),
})

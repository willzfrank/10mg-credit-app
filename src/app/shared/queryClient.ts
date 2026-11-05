import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { resolveTenantSlug } from '../features/tenant/resolveTenantSlug'
import { UnauthorizedError } from './api/errors'
import { logout } from './auth/authApi'
import { getSession } from './auth/authStore'

// A 401 on a signed-in request means the token is dead. Clearing the session makes
// RequireRole redirect to /login. Failed logins (no session yet) and 403s are left alone.
// Requests may set meta.tenantSlug; otherwise the slug the app resolved for this page is used.
function logoutOnUnauthorized(error: unknown, meta: Record<string, unknown> | undefined) {
  if (!(error instanceof UnauthorizedError)) return
  const slug = typeof meta?.tenantSlug === 'string' ? meta.tenantSlug : resolveTenantSlug()
  if (getSession(slug)) void logout(slug)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // The tenant config fetch is public and carries no token, so it never signs anyone out.
    onError: (error, query) => {
      if (query.queryKey[0] === 'tenant') return
      logoutOnUnauthorized(error, query.meta)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => logoutOnUnauthorized(error, mutation.meta),
  }),
})

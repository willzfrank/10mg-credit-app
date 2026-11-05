import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UnauthorizedError } from '../../shared/api/errors'
import { useSession } from '../../shared/auth/authStore'
import { fetchTenantConfig, updateTenantConfig } from './api'
import type { TenantConfigForm } from './configFormSchema'

export const tenantKeys = {
  config: (slug: string) => ['tenant', slug, 'config'] as const,
}

export function useTenantConfig(slug: string) {
  return useQuery({
    queryKey: tenantKeys.config(slug),
    queryFn: () => fetchTenantConfig(slug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useUpdateTenantConfig(slug: string) {
  const queryClient = useQueryClient()
  const token = useSession(slug)?.accessToken
  return useMutation({
    meta: { tenantSlug: slug },
    mutationFn: (form: TenantConfigForm) => {
      if (!token) throw new UnauthorizedError()
      return updateTenantConfig(token, slug, form)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.config(slug) }),
  })
}

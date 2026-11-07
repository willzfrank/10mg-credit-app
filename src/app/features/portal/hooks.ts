import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../shared/auth/authStore'
import {
  getLoan,
  listLoanRepayments,
  listLoans,
  makeRepayment,
  submitApplication,
  type ApplicationInput,
  type RepaymentInput,
} from '../loans/api'
import { useTenant } from '../tenant/useTenant'

function useScope() {
  const { slug } = useTenant()
  const session = useSession(slug)
  return { slug, token: session?.accessToken, userId: session?.user.id }
}

const keyFor = (scope: ReturnType<typeof useScope>, name: string, ...ids: string[]) =>
  ['portal', scope.slug, scope.userId, name, ...ids] as const

function usePortalQuery<T>(name: string, ids: string[], fn: (token: string) => Promise<T>) {
  const scope = useScope()
  return useQuery({
    queryKey: keyFor(scope, name, ...ids),
    queryFn: () => fn(scope.token!),
    enabled: !!scope.token,
    retry: false,
    meta: { tenantSlug: scope.slug },
  })
}

export const useMyLoans = () => usePortalQuery('loans', [], listLoans)
export const useLoan = (id: string) => usePortalQuery('loan', [id], (token) => getLoan(token, id))
export const useLoanRepayments = (id: string) =>
  usePortalQuery('repayments', [id], (token) => listLoanRepayments(token, id))

export function useSubmitApplication() {
  const scope = useScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ApplicationInput) => submitApplication(scope.token!, input),
    meta: { tenantSlug: scope.slug },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal', scope.slug, scope.userId] }),
  })
}

export function useMakeRepayment(loanId: string) {
  const scope = useScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RepaymentInput) => makeRepayment(scope.token!, loanId, input),
    meta: { tenantSlug: scope.slug },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['portal', scope.slug, scope.userId] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', scope.slug] }),
      ]),
  })
}

export const newIdempotencyKey = () =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

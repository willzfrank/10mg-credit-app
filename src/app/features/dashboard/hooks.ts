import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'
import { ConflictError } from '../../shared/api/errors'
import { useSession } from '../../shared/auth/authStore'
import { formatMoney } from '../../shared/formatMoney'
import { listLoans } from '../loans/api'
import { useTenant } from '../tenant/useTenant'
import { decideLoan, getDashboardSummary, listCustomers, listRepayments } from './api'

function useScope() {
  const { slug } = useTenant()
  const session = useSession(slug)
  return { slug, token: session?.accessToken, userId: session?.user.id }
}

const keyFor = (scope: ReturnType<typeof useScope>, name: string, ...filters: unknown[]) =>
  ['dashboard', scope.slug, scope.userId, name, ...filters] as const

function useDashboardQuery<T>(name: string, fn: (token: string) => Promise<T>) {
  const scope = useScope()
  return useQuery({
    queryKey: keyFor(scope, name),
    queryFn: () => fn(scope.token!),
    enabled: !!scope.token,
    retry: false,
    meta: { tenantSlug: scope.slug },
  })
}

export const useDashboardSummary = () => useDashboardQuery('summary', getDashboardSummary)
export const useCustomers = () => useDashboardQuery('customers', listCustomers)
export const useRepayments = () => useDashboardQuery('repayments', listRepayments)
export const useLoans = () => useDashboardQuery('loans', listLoans)

export function useDecideLoan() {
  const scope = useScope()
  const queryClient = useQueryClient()
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keyFor(scope, 'summary') }),
      queryClient.invalidateQueries({ queryKey: keyFor(scope, 'loans') }),
    ])
  return useMutation({
    mutationFn: ({ loanId, decision }: { loanId: string; decision: 'approved' | 'rejected' }) =>
      decideLoan(scope.token!, loanId, decision),
    meta: { tenantSlug: scope.slug },
    onSuccess: (_, variables) => {
      refresh()
      toast.success(`Loan ${variables.loanId} ${variables.decision}`)
    },
    onError: (error) => {
      if (error instanceof ConflictError) refresh()
      toast.error(error.message || 'Action failed')
    },
  })
}

export function useFormatters() {
  const { settings } = useTenant()
  return {
    money: (minor: number) => formatMoney(minor, settings.currency, settings.locale),
    date: (iso: string) =>
      new Intl.DateTimeFormat(settings.locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso)),
  }
}

import { useLayoutEffect, useMemo, type ReactNode } from 'react'
import { NotFoundError } from '../../shared/api/errors'
import { LoadingScreen } from '../../shared/LoadingScreen'
import { applyTheme } from './applyTheme'
import { resolveTenantSlug } from './resolveTenantSlug'
import { TenantContext } from './tenantContext'
import { useTenantConfig } from './useTenantConfig'

interface StatusScreenProps {
  role: 'alert'
  title: string
  message?: string
  children?: ReactNode
}

function StatusScreen({ role, title, message, children }: StatusScreenProps) {
  return (
    <main role={role} className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {message && <p className="text-sm opacity-70">{message}</p>}
      {children}
    </main>
  )
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const slug = useMemo(() => resolveTenantSlug(), [])
  const { data, error, refetch, isFetching } = useTenantConfig(slug)

  useLayoutEffect(() => {
    if (!data) return
    applyTheme(data)
    document.title = data.name
  }, [data])

  if (data) return <TenantContext.Provider value={data}>{children}</TenantContext.Provider>

  if (error instanceof NotFoundError) {
    return (
      <StatusScreen
        role="alert"
        title="Institution not found"
        message={`We couldn't find an institution called "${slug}".`}
      />
    )
  }

  if (error) {
    return (
      <StatusScreen
        role="alert"
        title="Something went wrong"
        message="We couldn't load this institution. Check your connection and try again."
      >
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        >
          {isFetching ? 'Retrying…' : 'Try again'}
        </button>
      </StatusScreen>
    )
  }

  return <LoadingScreen />
}

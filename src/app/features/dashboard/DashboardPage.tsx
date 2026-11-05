import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDashboardSummary, useFormatters } from './hooks'
import { ApplicationsPanel, CustomersPanel, RepaymentsPanel } from './panels'

const TABS = [
  { id: 'applications', label: 'Applications', Panel: ApplicationsPanel },
  { id: 'customers', label: 'Customers', Panel: CustomersPanel },
  { id: 'repayments', label: 'Repayments', Panel: RepaymentsPanel },
] as const

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div role="group" aria-label={label} className="min-w-0 rounded-lg border p-4">
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-1 text-xl font-semibold break-words">{value}</p>
    </div>
  )
}

export function DashboardPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('applications')
  const summary = useDashboardSummary()
  const { money } = useFormatters()
  const s = summary.data
  const active = TABS.find((t) => t.id === tab)!

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {summary.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-destructive">{summary.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => summary.refetch()} disabled={summary.isFetching}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Pending applications" value={s ? String(s.applications) : '—'} />
        <Kpi label="Customers" value={s ? String(s.customers) : '—'} />
        <Kpi label="Approved loans" value={s ? String(s.approvedLoans) : '—'} />
        <Kpi label="Outstanding balance" value={s ? money(s.outstandingMinor) : '—'} />
      </div>

      <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="Dashboard sections" className="flex gap-1 border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="dashboard-panel"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm ${tab === t.id ? 'border-b-2 border-primary font-medium' : 'opacity-70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id="dashboard-panel" aria-labelledby={`tab-${active.id}`} className="min-w-0">
          <active.Panel />
        </div>
      </div>
    </div>
  )
}

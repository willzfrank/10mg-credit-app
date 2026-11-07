import { useEffect, useState } from 'react'
import {
  ClockIcon,
  RefreshCwIcon,
  UsersIcon,
  WalletIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { useDashboardSummary, useFormatters } from './hooks'
import { ApplicationsPanel, CustomersPanel, RepaymentsPanel } from './panels'
import { PageHeader } from '../../shared/PageHeader'

const TABS = [
  { id: 'applications', label: 'Applications', Panel: ApplicationsPanel },
  { id: 'customers', label: 'Customers', Panel: CustomersPanel },
  { id: 'repayments', label: 'Repayments', Panel: RepaymentsPanel },
] as const

type TabId = (typeof TABS)[number]['id']

function Kpi({
  label,
  value,
  icon,
  helper,
  variant = 'accent',
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  helper?: string
  variant?: 'primary' | 'secondary' | 'accent'
}) {
  const IconComponent = icon
  const badgeClass =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground'
      : variant === 'secondary'
      ? 'bg-secondary text-secondary-foreground border border-secondary/40'
      : 'bg-accent text-accent-foreground border border-accent/40'

  return (
    <Card
      role="group"
      aria-label={label}
      className="min-w-0 border border-border bg-card shadow-2xs hover:border-zinc-300 transition-colors"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <span className={`flex size-7 items-center justify-center rounded-md ${badgeClass}`}>
            <IconComponent className="size-4" />
          </span>
        </div>
        <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground break-words tabular-nums">
          {value}
        </p>
        {helper && (
          <p className="mt-1 text-xs text-muted-foreground">
            {helper}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [tab, setTab] = useState<TabId>('applications')
  const summary = useDashboardSummary()
  const { money } = useFormatters()
  const s = summary.data

  useEffect(() => {
    if (summary.error) {
      toast.error(summary.error.message || 'Failed to load dashboard metrics')
    }
  }, [summary.error])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Applications, customers and repayments at a glance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => summary.refetch()}
            disabled={summary.isFetching}
            className="h-8 gap-1.5 text-xs font-normal border-border bg-background hover:bg-muted"
          >
            <RefreshCwIcon className={`size-3 ${summary.isFetching ? 'animate-spin' : ''}`} />
            <span>{summary.isFetching ? 'Refreshing…' : 'Refresh'}</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Pending applications"
          icon={ClockIcon}
          variant="secondary"
          value={s ? String(s.applications) : '—'}
          helper="Awaiting credit decision"
        />
        <Kpi
          label="Customers"
          icon={UsersIcon}
          variant="accent"
          value={s ? String(s.customers) : '—'}
          helper="Registered borrowers"
        />
        <Kpi
          label="Approved loans"
          icon={CheckCircle2Icon}
          variant="primary"
          value={s ? String(s.approvedLoans) : '—'}
          helper="Active credit facilities"
        />
        <Kpi
          label="Outstanding balance"
          icon={WalletIcon}
          variant="secondary"
          value={s ? money(s.outstandingMinor) : '—'}
          helper="Total principal & interest due"
        />
      </div>

      <Card className="border border-border bg-card shadow-2xs rounded-lg overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="gap-5">
            <TabsList aria-label="Dashboard sections" className="h-9 p-0.5 bg-muted/60 border border-border">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="px-3.5 text-xs font-medium data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((t) => (
              <TabsContent key={t.id} value={t.id} className="min-w-0 pt-2 outline-none">
                <t.Panel />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

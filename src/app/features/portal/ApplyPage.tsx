import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AmountInput } from '../../shared/AmountInput'
import { formatMoney } from '../../shared/formatMoney'
import type { TenantSettings } from '../tenant/types'
import { useTenant } from '../tenant/useTenant'
import { newIdempotencyKey, useSubmitApplication } from './hooks'
import { DetailRow } from '../../shared/TextBits'

interface Limits {
  min: string
  max: string
  minValue: number
  maxValue: number
  maxTenor: number
}

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

const makeSchema = (limits: Limits) =>
  z.object({
    amount: z
      .number({ error: 'Enter an amount' })
      .min(limits.minValue, `Amount must be at least ${limits.min}`)
      .max(limits.maxValue, `Amount must be at most ${limits.max}`)
      .refine(hasAtMostTwoDecimals, 'Use at most 2 decimal places'),
    tenorMonths: z
      .number({ error: 'Enter a number of months' })
      .int('Use whole months')
      .min(1, 'Tenor must be at least 1 month')
      .max(limits.maxTenor, `Tenor must be at most ${limits.maxTenor} months`),
  })

type ApplyValues = z.infer<ReturnType<typeof makeSchema>>

const fmtLimit = (major: number, s: TenantSettings) => formatMoney(Math.round(major * 100), s.currency, s.locale)

export function ApplyPage() {
  const { settings } = useTenant()
  const navigate = useNavigate()
  const [idempotencyKey] = useState(() => newIdempotencyKey())
  const submit = useSubmitApplication()

  const limits = useMemo<Limits>(
    () => ({
      min: fmtLimit(settings.minLoanAmount, settings),
      max: fmtLimit(settings.maxLoanAmount, settings),
      minValue: settings.minLoanAmount,
      maxValue: settings.maxLoanAmount,
      maxTenor: settings.maxTenorMonths,
    }),
    [settings],
  )
  const schema = useMemo(() => makeSchema(limits), [limits])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined,
      tenorMonths: undefined,
    },
  })

  const watchedAmount = useWatch({ control, name: 'amount' })
  const watchedTenor = useWatch({ control, name: 'tenorMonths' })

  // Financial calculations for breakdown
  const validAmount = typeof watchedAmount === 'number' && !isNaN(watchedAmount) && watchedAmount > 0 ? watchedAmount : 0
  const validTenor = typeof watchedTenor === 'number' && !isNaN(watchedTenor) && watchedTenor > 0 ? watchedTenor : 0

  const estimatedInterest =
    validAmount > 0 && validTenor > 0
      ? validAmount * (settings.interestRate / 100) * (validTenor / 12)
      : 0
  const estimatedTotal = validAmount + estimatedInterest
  const estimatedMonthly = validTenor > 0 ? estimatedTotal / validTenor : 0

  const onSubmit = (values: ApplyValues) =>
    submit.mutate(
      { amountMinor: Math.round(values.amount * 100), tenorMonths: values.tenorMonths, idempotencyKey },
      { onSuccess: (loan) => navigate(`/portal/loans/${loan.id}`) },
    )

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            to="/portal"
            className="flex size-7 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Back to loans"
          >
            <ArrowLeftIcon className="size-3.5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Apply for a loan</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit financing terms for institutional underwriting.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Application Form (Left) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="lg:col-span-7 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:p-6 shadow-2xs"
        >
          {/* Amount Field */}
          <Label className="flex-col items-stretch gap-1.5 text-xs font-medium text-foreground">
            <div className="flex items-center justify-between">
              <span>Amount ({settings.currency})</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Min: {limits.min} · Max: {limits.max}
              </span>
            </div>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <AmountInput
                  placeholder={String(settings.minLoanAmount)}
                  className="h-9 text-xs font-medium tabular-nums"
                  aria-invalid={!!errors.amount}
                  name={field.name}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
            <span className="opacity-70 text-[11px] text-muted-foreground">
              Between {limits.min} and {limits.max}
            </span>
            {errors.amount && (
              <span role="alert" className="text-xs text-destructive">
                {errors.amount.message}
              </span>
            )}
          </Label>

          {/* Tenor Field */}
          <Label className="flex-col items-stretch gap-1.5 text-xs font-medium text-foreground">
            <div className="flex items-center justify-between">
              <span>Tenor (months)</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Up to {limits.maxTenor} months
              </span>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 6"
              className="h-9 text-xs font-medium tabular-nums"
              aria-invalid={!!errors.tenorMonths}
              {...register('tenorMonths', { valueAsNumber: true })}
            />
            <span className="opacity-70 text-[11px] text-muted-foreground">
              Between 1 and {limits.maxTenor} months
            </span>
            {errors.tenorMonths && (
              <span role="alert" className="text-xs text-destructive">
                {errors.tenorMonths.message}
              </span>
            )}
          </Label>

          {submit.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
            >
              {submit.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <Button
              type="submit"
              disabled={submit.isPending}
              className="h-8 px-4 text-xs font-medium cursor-pointer"
            >
              {submit.isPending ? 'Submitting…' : 'Submit'}
            </Button>
            <Link
              to="/portal"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Financial Terms Breakdown Card (Right) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="border border-border border-t-2 border-t-secondary bg-card shadow-2xs">
            <CardHeader className="p-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Terms Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3">
              <DetailRow label="Principal Requested">
                  {validAmount > 0
                    ? formatMoney(Math.round(validAmount * 100), settings.currency, settings.locale)
                    : '—'}
                </DetailRow>
              <DetailRow label="Annual Interest Rate">{settings.interestRate}%</DetailRow>
              <DetailRow label="Estimated Interest">
                  {validAmount > 0 && validTenor > 0
                    ? formatMoney(Math.round(estimatedInterest * 100), settings.currency, settings.locale)
                    : '—'}
                </DetailRow>
              <DetailRow strong label="Total Obligation">
                  {validAmount > 0 && validTenor > 0
                    ? formatMoney(Math.round(estimatedTotal * 100), settings.currency, settings.locale)
                    : '—'}
                </DetailRow>
              <div className="flex justify-between items-center text-xs mt-1 rounded-md bg-accent text-accent-foreground px-2.5 py-2">
                <span className="font-semibold ">Estimated Monthly</span>
                <span className="font-bold text-sm  tabular-nums">
                  {validAmount > 0 && validTenor > 0
                    ? formatMoney(Math.round(estimatedMonthly * 100), settings.currency, settings.locale)
                    : '—'}
                </span>
              </div>

              <div className="mt-2 rounded bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/60">
                Final approval and rate confirmation are subject to underwriter review against tenant limits.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Controller, useForm, useWatch, type UseFormRegister, type UseFormSetValue, type Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '../portal/StatusBadge'
import { applyTheme } from './applyTheme'
import { getPrimaryContrastWarning, tenantConfigFormSchema, type TenantConfigForm } from './configFormSchema'
import { readLogoFile } from './readLogoFile'
import { hexColor, type TenantColors, type TenantConfig } from './types'
import { useTenant } from './useTenant'
import { useUpdateTenantConfig } from './useTenantConfig'

const toFormValues = ({ name, logoUrl, colors, settings }: TenantConfig): TenantConfigForm => ({
  name,
  logoUrl,
  colors: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
  settings: { ...settings },
})

const emptyToUndefined = (value: string) => (value === '' ? undefined : value)

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <Label className="flex-col items-stretch gap-1.5 text-xs font-medium text-foreground">
      {label}
      {children}
      {error && <span role="alert" className="text-xs font-normal text-destructive">{error}</span>}
    </Label>
  )
}

const pickerValue = (value: string | undefined) => {
  if (!value || !hexColor.safeParse(value).success) return '#000000'
  return value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : value.toLowerCase()
}

type ColorName = 'colors.primary' | 'colors.secondary' | 'colors.accent'

function ColorField({
  control,
  register,
  setValue,
  name,
  label,
  placeholder,
  error,
}: {
  control: Control<TenantConfigForm>
  register: UseFormRegister<TenantConfigForm>
  setValue: UseFormSetValue<TenantConfigForm>
  name: ColorName
  label: string
  placeholder: string
  error?: string
}) {
  const value = useWatch({ control, name })
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-2">
        <div className="relative size-8 shrink-0 overflow-hidden rounded border border-border">
          <input
            type="color"
            aria-label={`${label} picker`}
            className="absolute -inset-2 size-12 cursor-pointer"
            value={pickerValue(value)}
            onChange={(e) => setValue(name, e.target.value, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
        <Input
          className="min-w-0 flex-1 font-mono text-xs uppercase h-8"
          placeholder={placeholder}
          {...register(name, { setValueAs: emptyToUndefined })}
        />
      </div>
    </Field>
  )
}

/** Shows the logo being edited; falls back to a brand-coloured dot while it is empty or fails to load. */
function PreviewLogo({ src }: { src: string | undefined }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <span className="size-2 rounded-full bg-primary" />
  return <img src={src} alt="" className="h-6 max-w-24 object-contain" onError={() => setFailed(true)} />
}

const PRESET_PALETTES = [
  { label: 'Teal', primary: '#0f766e', secondary: '#fcd34d', accent: '#ccfbf1' },
  { label: 'Indigo', primary: '#4338ca', secondary: '#a5b4fc', accent: '#e0e7ff' },
  { label: 'Violet', primary: '#5b21b6', secondary: '#fb923c', accent: '#ede9fe' },
  { label: 'Slate', primary: '#0f172a', secondary: '#94a3b8', accent: '#f1f5f9' },
]

export function TenantConfigPage() {
  const tenant = useTenant()
  const update = useUpdateTenantConfig(tenant.slug)
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<TenantConfigForm>({
    resolver: zodResolver(tenantConfigFormSchema),
    defaultValues: toFormValues(tenant),
  })

  const primary = useWatch({ control, name: 'colors.primary' })
  const secondary = useWatch({ control, name: 'colors.secondary' })
  const accent = useWatch({ control, name: 'colors.accent' })
  const watchedName = useWatch({ control, name: 'name' })
  const watchedLogo = useWatch({ control, name: 'logoUrl' })
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const watchedCurrency = useWatch({ control, name: 'settings.currency' })
  const watchedRate = useWatch({ control, name: 'settings.interestRate' })

  useEffect(() => {
    const valid = (value: string | undefined) => (hexColor.safeParse(value).success ? value : undefined)
    const colors: TenantColors = { primary: valid(primary), secondary: valid(secondary), accent: valid(accent) }
    applyTheme({ ...tenant, colors })
    return () => applyTheme(tenant)
  }, [tenant, primary, secondary, accent])

  const isUploadedLogo = watchedLogo?.startsWith('data:') ?? false

  const onLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setValue('logoUrl', await readLogoFile(file), { shouldDirty: true, shouldValidate: true })
      setUploadError(null)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not upload that logo')
    }
  }

  const contrastWarning = hexColor.safeParse(primary).success ? getPrimaryContrastWarning(primary) : null

  const onSubmit = (form: TenantConfigForm) =>
    update.mutate(form, { onSuccess: (saved) => reset(toFormValues(saved)) })

  const num = { valueAsNumber: true } as const

  const applyPalette = (palette: (typeof PRESET_PALETTES)[number]) => {
    setValue('colors.primary', palette.primary, { shouldDirty: true, shouldValidate: true })
    setValue('colors.secondary', palette.secondary, { shouldDirty: true, shouldValidate: true })
    setValue('colors.accent', palette.accent, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Institution settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure white-label branding and lending parameters for {tenant.name}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Branding Card */}
            <Card className="border border-border bg-card shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Branding
                </CardTitle>
                <CardDescription className="text-xs">
                  Institution identification and theme colors applied to your tenant workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
                <Field label="Name" error={errors.name?.message}>
                  <Input className="h-8 text-xs" {...register('name')} />
                </Field>

                <div className="flex flex-col gap-1.5">
                  <Field label="Logo URL" error={errors.logoUrl?.message}>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder={isUploadedLogo ? 'Uploaded image' : 'https://… or /logo.svg'}
                      {...register('logoUrl')}
                      value={isUploadedLogo ? '' : (watchedLogo ?? '')}
                    />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      aria-label="Upload logo"
                      className="sr-only"
                      onChange={onLogoFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInput.current?.click()}
                      className="h-8 px-3 text-xs cursor-pointer"
                    >
                      Upload logo
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      {isUploadedLogo ? 'Using uploaded image. ' : ''}PNG, JPEG, WebP, GIF or SVG, up to 200 KB.
                    </span>
                  </div>
                  {uploadError && (
                    <span role="alert" className="text-xs text-destructive">
                      {uploadError}
                    </span>
                  )}
                </div>

                {/* Color Presets */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground">Color Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PALETTES.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPalette(p)}
                        className="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted transition-colors cursor-pointer"
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: p.primary }} />
                        <span className="text-[11px]">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <ColorField
                    control={control}
                    register={register}
                    setValue={setValue}
                    name="colors.primary"
                    label="Primary colour"
                    placeholder="#1a56db"
                    error={errors.colors?.primary?.message}
                  />
                  <ColorField
                    control={control}
                    register={register}
                    setValue={setValue}
                    name="colors.secondary"
                    label="Secondary colour"
                    placeholder="#e5e7eb"
                    error={errors.colors?.secondary?.message}
                  />
                  <ColorField
                    control={control}
                    register={register}
                    setValue={setValue}
                    name="colors.accent"
                    label="Accent colour"
                    placeholder="#f59e0b"
                    error={errors.colors?.accent?.message}
                  />
                </div>

                {contrastWarning && (
                  <p
                    role="status"
                    className="rounded border border-amber-300/80 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-700 dark:text-amber-300"
                  >
                    {contrastWarning}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Loan Settings Card */}
            <Card className="border border-border bg-card shadow-2xs">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Loan settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Underwriting thresholds, base rates, and tenor limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Currency" error={errors.settings?.currency?.message}>
                  <Controller
                    control={control}
                    name="settings.currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN" className="text-xs">NGN</SelectItem>
                          <SelectItem value="USD" className="text-xs">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field label="Locale" error={errors.settings?.locale?.message}>
                  <Input className="h-8 text-xs font-mono" {...register('settings.locale')} />
                </Field>

                <Field label="Minimum loan amount" error={errors.settings?.minLoanAmount?.message}>
                  <Input type="number" className="h-8 text-xs tabular-nums" {...register('settings.minLoanAmount', num)} />
                </Field>

                <Field label="Maximum loan amount" error={errors.settings?.maxLoanAmount?.message}>
                  <Input type="number" className="h-8 text-xs tabular-nums" {...register('settings.maxLoanAmount', num)} />
                </Field>

                <Field label="Interest rate (%)" error={errors.settings?.interestRate?.message}>
                  <Input type="number" step="any" className="h-8 text-xs tabular-nums" {...register('settings.interestRate', num)} />
                </Field>

                <Field label="Maximum tenor (months)" error={errors.settings?.maxTenorMonths?.message}>
                  <Input type="number" className="h-8 text-xs tabular-nums" {...register('settings.maxTenorMonths', num)} />
                </Field>
              </CardContent>
            </Card>

            {update.error && (
              <p
                role="alert"
                className="rounded border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
              >
                {update.error.message}
              </p>
            )}

            {update.isSuccess && !isDirty && (
              <p
                role="status"
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
              >
                Saved.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={update.isPending}
                className="h-8 px-4 text-xs font-medium cursor-pointer"
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset(toFormValues(tenant))
                  update.reset()
                }}
                className="h-8 px-3 text-xs border-border cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Right Column: Live Portal & Branding Preview (5 cols) */}
          {/* On mobile the preview comes first so changes are visible right away */}
          <div className="order-first lg:order-none lg:col-span-5 flex flex-col gap-4">
            <Card className="border border-border bg-card shadow-2xs lg:sticky lg:top-20">
              <CardHeader className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Portal Preview
                  </CardTitle>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                    {watchedCurrency || tenant.settings.currency}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Real-time preview of how tenant branding and tokens apply to borrower views.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-4">
                {/* Mock Card Preview */}
                <div className="rounded-lg border border-border bg-background p-4 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <PreviewLogo key={watchedLogo} src={watchedLogo} />
                      <span className="font-semibold text-xs text-foreground">
                        {watchedName || tenant.name}
                      </span>
                    </div>
                    <StatusBadge status="approved" />
                  </div>

                  <div className="rounded bg-muted/40 p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                        Annual Rate
                      </span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {watchedRate ?? tenant.settings.interestRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                        Currency
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {watchedCurrency || tenant.settings.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="h-8 text-xs font-medium flex-1 cursor-default">
                      Apply Now
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs cursor-default">
                      Details
                    </Button>
                  </div>
                </div>

                {/* Active CSS Custom Properties summary */}
                <div className="rounded bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/60">
                  <span className="text-[11px] font-medium text-foreground uppercase tracking-wider block mb-1">
                    CSS Variables:
                  </span>
                  <div className="font-mono text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>--primary:</span>
                      <span className="text-foreground">{primary || tenant.colors.primary || 'default'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>--secondary:</span>
                      <span className="text-foreground">{secondary || tenant.colors.secondary || 'default'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>--accent:</span>
                      <span className="text-foreground">{accent || tenant.colors.accent || 'default'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

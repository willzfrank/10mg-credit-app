import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch, type UseFormRegister, type UseFormSetValue, type Control } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { applyTheme } from './applyTheme'
import { getPrimaryContrastWarning, tenantConfigFormSchema, type TenantConfigForm } from './configFormSchema'
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

const inputClass = 'h-9 rounded-md border border-input px-3'

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
      {error && <span role="alert" className="text-destructive">{error}</span>}
    </label>
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
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input p-1"
          value={pickerValue(value)}
          onChange={(e) => setValue(name, e.target.value, { shouldDirty: true, shouldValidate: true })}
        />
        <input
          className={`${inputClass} min-w-0 flex-1`}
          placeholder={placeholder}
          {...register(name, { setValueAs: emptyToUndefined })}
        />
      </div>
    </Field>
  )
}

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

  useEffect(() => {
    const valid = (value: string | undefined) => (hexColor.safeParse(value).success ? value : undefined)
    const colors: TenantColors = { primary: valid(primary), secondary: valid(secondary), accent: valid(accent) }
    applyTheme({ ...tenant, colors })
    return () => applyTheme(tenant)
  }, [tenant, primary, secondary, accent])

  const contrastWarning = hexColor.safeParse(primary).success ? getPrimaryContrastWarning(primary) : null

  const onSubmit = (form: TenantConfigForm) =>
    update.mutate(form, { onSuccess: (saved) => reset(toFormValues(saved)) })

  const num = { valueAsNumber: true } as const

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <h1 className="text-xl font-semibold">Institution settings</h1>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-medium">Branding</legend>
        <Field label="Name" error={errors.name?.message}>
          <input className={inputClass} {...register('name')} />
        </Field>
        <Field label="Logo URL" error={errors.logoUrl?.message}>
          <input className={inputClass} {...register('logoUrl')} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <ColorField control={control} register={register} setValue={setValue} name="colors.primary" label="Primary colour" placeholder="#1a56db" error={errors.colors?.primary?.message} />
          <ColorField control={control} register={register} setValue={setValue} name="colors.secondary" label="Secondary colour" placeholder="#e5e7eb" error={errors.colors?.secondary?.message} />
          <ColorField control={control} register={register} setValue={setValue} name="colors.accent" label="Accent colour" placeholder="#f59e0b" error={errors.colors?.accent?.message} />
        </div>
        {contrastWarning && <p role="status" className="text-sm text-amber-700">{contrastWarning}</p>}
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4">
        <legend className="mb-2 font-medium">Loan settings</legend>
        <Field label="Currency" error={errors.settings?.currency?.message}>
          <select className={inputClass} {...register('settings.currency')}>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="Locale" error={errors.settings?.locale?.message}>
          <input className={inputClass} {...register('settings.locale')} />
        </Field>
        <Field label="Minimum loan amount" error={errors.settings?.minLoanAmount?.message}>
          <input type="number" className={inputClass} {...register('settings.minLoanAmount', num)} />
        </Field>
        <Field label="Maximum loan amount" error={errors.settings?.maxLoanAmount?.message}>
          <input type="number" className={inputClass} {...register('settings.maxLoanAmount', num)} />
        </Field>
        <Field label="Interest rate (%)" error={errors.settings?.interestRate?.message}>
          <input type="number" step="any" className={inputClass} {...register('settings.interestRate', num)} />
        </Field>
        <Field label="Maximum tenor (months)" error={errors.settings?.maxTenorMonths?.message}>
          <input type="number" className={inputClass} {...register('settings.maxTenorMonths', num)} />
        </Field>
      </fieldset>

      {update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
      {update.isSuccess && !isDirty && <p role="status" className="text-sm">Saved.</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="outline" onClick={() => {
            reset(toFormValues(tenant))
            update.reset()
          }}>Cancel</Button>
      </div>
    </form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { login } from '../../shared/auth/authApi'
import { useSession } from '../../shared/auth/authStore'
import { homePathFor } from '../../shared/auth/homePath'
import { TenantLogo } from '../tenant/TenantLogo'
import { useTenant } from '../tenant/useTenant'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { slug, name } = useTenant()
  const session = useSession(slug)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(slug, values),
    onSuccess: (s) => navigate(homePathFor(s.user.role), { replace: true }),
  })

  if (session) return <Navigate to={homePathFor(session.user.role)} replace />

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex w-full max-w-sm flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <TenantLogo className="h-12 w-auto" />
          <h1 className="text-xl font-semibold">Sign in to {name}</h1>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            autoComplete="username"
            className="h-9 rounded-md border border-input px-3"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <span role="alert" className="text-destructive">{errors.email.message}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="h-9 rounded-md border border-input px-3"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <span role="alert" className="text-destructive">{errors.password.message}</span>}
        </label>

        {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  )
}

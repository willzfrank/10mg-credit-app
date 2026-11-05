import { useMutation } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { logout } from '../../shared/auth/authApi'
import { TenantLogo } from '../tenant/TenantLogo'
import { useTenant } from '../tenant/useTenant'

export interface NavItem {
  to: string
  label: string
}

export function AppShell({ nav }: { nav: NavItem[] }) {
  const { slug, name } = useTenant()
  const signOut = useMutation({ mutationFn: () => logout(slug) })

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 sm:px-6">
        <TenantLogo className="h-8 w-auto" />
        <span className="font-semibold">{name}</span>
        <nav aria-label="Main" className="flex gap-4 text-sm sm:ml-6">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? 'font-medium underline underline-offset-4' : 'opacity-70')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="outline" className="ml-auto" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}

import { useMutation } from '@tanstack/react-query'
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
} from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, useLocation, useMatch, useNavigate } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { DEMO_TENANTS } from '../../mocks/tenants'
import { ThemeToggle } from '../../shared/theme/ThemeToggle'
import { logout } from '../../shared/auth/authApi'
import { useSession } from '../../shared/auth/authStore'
import { TenantLogo } from '../tenant/TenantLogo'
import { useTenant } from '../tenant/useTenant'
import { Icon, type IconName } from './icons'

interface NavItem {
  to: string
  label: string
  icon?: IconName
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function NavButton({ item }: { item: NavItem }) {
  const active = !!useMatch({ path: item.to, end: true })
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        render={<Link to={item.to} aria-current={active ? 'page' : undefined} onClick={() => setOpenMobile(false)} />}
        className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors ${
          active
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        {item.icon && <Icon name={item.icon} className="size-4 shrink-0" />}
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppShell({ nav }: { nav: NavItem[] }) {
  const { slug, name, settings } = useTenant()
  const session = useSession(slug)
  const navigate = useNavigate()
  const signOut = useMutation({
    mutationFn: () => logout(slug),
    onSuccess: () => navigate('/login', { replace: true }),
  })
  const user = session?.user
  const location = useLocation()

  const currentNav = nav.find((n) => n.to === location.pathname)
  const otherTenants = DEMO_TENANTS.filter((t) => t.slug !== slug)

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border bg-sidebar">
        {/* Sidebar Header with clean branding */}
        <SidebarHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <TenantLogo className="h-6 w-auto" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded border border-border">
              {settings.currency}
            </span>
          </div>
        </SidebarHeader>

        {/* Sidebar Navigation */}
        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2.5 mb-1">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <nav aria-label="Main">
                <SidebarMenu className="gap-0.5">
                  {nav.map((item) => (
                    <NavButton key={item.to} item={item} />
                  ))}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer with clean user profile dropdown */}
        <SidebarFooter className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="default"
                  className="rounded-md border border-border bg-background p-1.5 hover:bg-muted transition-colors cursor-pointer"
                />
              }
            >
              <Avatar className="size-6 rounded">
                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold rounded">
                  {user ? initials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left leading-none min-w-0 flex-1">
                <span className="truncate text-xs font-medium text-foreground">{user?.name}</span>
                <span className="truncate text-[10px] text-muted-foreground mt-0.5">{user?.email}</span>
              </div>
              <ChevronsUpDownIcon className="size-3 text-muted-foreground ml-auto shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal px-2 py-1.5 text-xs text-muted-foreground">
                  Signed in as <strong className="text-foreground">{user?.name ?? 'User'}</strong>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive text-xs cursor-pointer"
              >
                <LogOutIcon className="size-3.5 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background min-h-screen flex flex-col">
        {/* Minimalist Top App Header */}
        <header className="sticky top-0 z-20 flex h-13 items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">{name}</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="font-semibold text-foreground">{currentNav?.label ?? 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Institution Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-normal border-border bg-background hover:bg-muted"
                  />
                }
              >
                <span className="text-muted-foreground">Tenant:</span>
                <span className="font-medium text-foreground ml-1">{slug}</span>
                <ChevronDownIcon className="size-3 text-muted-foreground ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Switch Tenant
                  </DropdownMenuLabel>
                  {otherTenants.map((t) => (
                    <DropdownMenuItem
                      key={t.slug}
                      onClick={() => {
                        window.location.search = `?tenant=${t.slug}`
                      }}
                      className="text-xs cursor-pointer"
                    >
                      Switch to {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ThemeToggle className="h-7 w-7 text-muted-foreground hover:text-foreground" />
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div role="status" className="flex flex-col gap-2.5 py-4">
                <span className="sr-only">Loading…</span>
                <Skeleton className="h-9 w-full rounded" />
                <Skeleton className="h-9 w-full rounded" />
                <Skeleton className="h-9 w-2/3 rounded" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

import {
  CircleCheckIcon,
  ClockIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'

const icons = {
  dashboard: LayoutDashboardIcon,
  settings: SettingsIcon,
  loans: CreditCardIcon,
  apply: PlusIcon,
  users: UsersIcon,
  clock: ClockIcon,
  check: CircleCheckIcon,
  wallet: WalletIcon,
  logout: LogOutIcon,
}

export type IconName = keyof typeof icons

export function Icon({ name, className = 'size-4' }: { name: IconName; className?: string }) {
  const Component = icons[name]
  return <Component aria-hidden="true" className={className} />
}

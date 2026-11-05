import { useSession } from '../../shared/auth/authStore'
import { useTenant } from '../tenant/useTenant'

export function PortalHome() {
  const { slug, name } = useTenant()
  const user = useSession(slug)?.user
  return <h1 className="text-xl font-semibold">Welcome to {name}{user ? `, ${user.name}` : ''}</h1>
}

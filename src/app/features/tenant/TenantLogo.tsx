import { useState } from 'react'
import { useTenant } from './useTenant'

export function TenantLogo({ className }: { className?: string }) {
  const { name, logoUrl } = useTenant()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (failedUrl === logoUrl) return <span className={className}>{name}</span>
  return <img src={logoUrl} alt={name} className={className} onError={() => setFailedUrl(logoUrl)} />
}

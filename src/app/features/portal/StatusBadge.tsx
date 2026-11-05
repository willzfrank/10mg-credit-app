export function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full border px-2 py-0.5 text-xs capitalize">{status}</span>
}

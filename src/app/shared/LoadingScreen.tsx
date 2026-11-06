/** Full-screen loading state. Shared so consecutive loading phases look like a single one. */
export function LoadingScreen() {
  return (
    <main role="status" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Loading…</h1>
    </main>
  )
}

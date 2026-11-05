import { create } from 'zustand'

export type Role = 'customer' | 'lender_admin'

export interface Session {
  accessToken: string
  user: { id: string; name: string; email: string; role: Role }
}

interface AuthState {
  sessions: ReadonlyMap<string, Session>
  setSession: (slug: string, session: Session) => void
  clearSession: (slug: string) => void
}

const STORAGE_PREFIX = 'session:'

function readStoredSessions(): Map<string, Session> {
  const sessions = new Map<string, Session>()
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key?.startsWith(STORAGE_PREFIX)) continue
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Session | null
      if (parsed && typeof parsed.accessToken === 'string' && parsed.user) {
        sessions.set(key.slice(STORAGE_PREFIX.length), parsed)
      }
    }
  } catch {
    return sessions
  }
  return sessions
}

function writeStoredSession(slug: string, session: Session | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_PREFIX + slug)
  } catch {
    return
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  sessions: readStoredSessions(),
  setSession: (slug, session) => {
    writeStoredSession(slug, session)
    set((state) => ({ sessions: new Map(state.sessions).set(slug, session) }))
  },
  clearSession: (slug) => {
    writeStoredSession(slug, null)
    set((state) => {
      if (!state.sessions.has(slug)) return state
      const sessions = new Map(state.sessions)
      sessions.delete(slug)
      return { sessions }
    })
  },
}))

export const getSession = (slug: string) => useAuthStore.getState().sessions.get(slug)
export const useSession = (slug: string) => useAuthStore((state) => state.sessions.get(slug))

// Server-side session store. Keeps access and refresh tokens out of the browser.
// Keyed by a random session ID that is sent to the browser as an HttpOnly cookie.
// Note: in-memory only — sessions are lost on server restart.

type ServerSession = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

const sessions = new Map<string, ServerSession>()

// Remove sessions whose access token expired more than 1 hour ago. The 1-hour buffer ensures
// a session is never deleted while a client refresh is still in-flight.
setInterval(
  () => {
    const cutoff = Date.now() - 60 * 60 * 1000
    for (const [id, session] of sessions) {
      if (session.expiresAt < cutoff) {
        sessions.delete(id)
      }
    }
  },
  15 * 60 * 1000, // run every 15 minutes
)

export function createSession(data: ServerSession): string {
  const id = crypto.randomUUID()
  sessions.set(id, data)
  return id
}

export function getSession(id: string): ServerSession | undefined {
  return sessions.get(id)
}

export function updateSession(id: string, data: Partial<ServerSession>): void {
  const existing = sessions.get(id)
  if (existing) {
    sessions.set(id, { ...existing, ...data })
  }
}

export function deleteSession(id: string): void {
  sessions.delete(id)
}

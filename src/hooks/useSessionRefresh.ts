import { useEffect } from 'react'
import type { AppSession } from '../types'
import { refreshAccessToken } from '../services/apiClient'

type UseSessionRefreshProps = {
  session: AppSession | null
  onSessionRefreshed: (session: AppSession) => void
  onRefreshFailed: () => void
}

export function useSessionRefresh({
  session,
  onSessionRefreshed,
  onRefreshFailed,
}: UseSessionRefreshProps) {
  useEffect(() => {
    if (!session?.expiresAt) {
      return
    }

    // Refresh 60 seconds before the access token expires.
    const msUntilRefresh = session.expiresAt - Date.now() - 60_000
    const timer = globalThis.setTimeout(
      async () => {
        try {
          // The server reads the refresh token from the session cookie — no token in request body.
          const tokenResponse = await refreshAccessToken()
          const refreshed: AppSession = {
            ...session,
            idTokenHint: tokenResponse.id_token ?? session.idTokenHint,
            expiresAt: Date.now() + tokenResponse.expires_in * 1000,
          }
          onSessionRefreshed(refreshed)
        } catch {
          onRefreshFailed()
        }
      },
      // If the token is already near or past expiry, refresh immediately.
      Math.max(0, msUntilRefresh),
    )

    return () => {
      globalThis.clearTimeout(timer)
    }
  }, [session, onSessionRefreshed, onRefreshFailed])
}

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AppSession } from '../types'
import { signOutSession } from '../services/apiClient'
import {
  clearStoredSession,
  readSession,
  saveSession,
} from '../services/sessionService'

export function useAuth() {
  const [session, setSession] = useState<AppSession | null>(() => readSession())
  const [loginError, setLoginError] = useState<string>()
  const queryClient = useQueryClient()

  const logout = useCallback((): void => {
    void signOutSession() // clears the HttpOnly session cookie and server-side token store
    clearStoredSession()
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  const setAndSaveSession = useCallback((newSession: AppSession): void => {
    saveSession(newSession)
    setSession(newSession)
  }, [])

  const clearError = useCallback((): void => {
    setLoginError(undefined)
  }, [])

  const setError = useCallback((error: unknown): void => {
    setLoginError(error instanceof Error ? error.message : 'An unknown error occurred')
  }, [])

  return {
    session,
    setSession: setAndSaveSession,
    loginError,
    setLoginError: setError,
    clearLoginError: clearError,
    logout,
  }
}

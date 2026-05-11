import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthenticatedApp } from './components/AuthenticatedApp'
import { UnauthenticatedApp } from './components/UnauthenticatedApp'
import {
  useAuth,
  useAuthCallback,
  useLogin,
  useSessionRefresh,
} from './hooks'
import { getWebhookEvents } from './services/apiClient'
import type { StoredWebhookEvent } from './types'

function AppRouter() {
  const {
    session,
    setSession,
    loginError,
    setLoginError,
    clearLoginError,
    logout,
  } = useAuth()

  // Handle login flow
  const { startLogin } = useLogin({ onError: setLoginError })

  const handleStartLogin = useCallback(async (): Promise<void> => {
    clearLoginError()
    await startLogin()
  }, [startLogin, clearLoginError])

  // Handle session refresh
  useSessionRefresh({
    session,
    onSessionRefreshed: setSession,
    onRefreshFailed: logout,
  })

  // Handle auth callback
  const { callbackMessage, webhookSubscriptionFailed } = useAuthCallback({
    onSessionCreated: setSession,
    onError: setLoginError,
  })

  // Fetch webhook events
  const eventsQuery = useQuery<StoredWebhookEvent[]>({
    queryKey: ['webhook-events', session?.workerId],
    enabled: Boolean(session),
    refetchInterval: 5000,
    queryFn: getWebhookEvents,
  })

  const orderedEvents = useMemo(
    () => [...(eventsQuery.data ?? [])].sort((a, b) => a.id - b.id),
    [eventsQuery.data],
  )

  // Render unauthenticated app if no session
  if (!session) {
    return (
      <UnauthenticatedApp
        callbackMessage={callbackMessage}
        loginError={loginError}
        onLogin={handleStartLogin}
      />
    )
  }

  // Render authenticated app with session
  return (
    <AuthenticatedApp
      session={session}
      webhookEvents={orderedEvents}
      webhookSubscriptionFailed={webhookSubscriptionFailed}
      onLogout={logout}
    />
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

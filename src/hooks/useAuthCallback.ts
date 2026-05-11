import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AppSession } from '../types'
import { exchangeAuthCode, getAuthConfig } from '../services/apiClient'
import { subscribeToWebhook } from '../services/essApi'
import { validateAuthorizationCodeResponse } from '../services/authFlowService'
import {
  clearAuthCallbackExchangeKey,
  clearOAuthTransaction,
  getAuthCallbackExchangeKey,
  readOAuthTransaction,
  saveAuthCallbackExchangeKey,
} from '../services/sessionService'

type UseAuthCallbackProps = {
  onSessionCreated: (session: AppSession) => void
  onError: (error: unknown) => void
}

export function useAuthCallback({ onSessionCreated, onError }: UseAuthCallbackProps) {
  const [callbackMessage, setCallbackMessage] = useState('Validating authorization response...')
  const [webhookSubscriptionFailed, setWebhookSubscriptionFailed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const completeLogin = useCallback(async (): Promise<void> => {
    try {
      const oauthTransaction = readOAuthTransaction()
      if (!oauthTransaction) {
        setCallbackMessage('Login callback is missing required parameters.')
        return
      }

      const { state: expectedState, codeVerifier, redirectUri } = oauthTransaction

      const authConfig = await getAuthConfig()
      const code = validateAuthorizationCodeResponse({
        authConfig,
        search: location.search,
        expectedState,
      })

      const callbackExchangeKey = `${code}:${expectedState}`
      const alreadyProcessedExchangeKey = getAuthCallbackExchangeKey()
      if (alreadyProcessedExchangeKey === callbackExchangeKey) {
        setCallbackMessage('Authorization response already processed. Redirecting...')
        navigate('/', { replace: true })
        return
      }

      // Mark this callback payload before token exchange so dev-mode double effects stay idempotent.
      saveAuthCallbackExchangeKey(callbackExchangeKey)
      setCallbackMessage('Exchanging authorization code for tokens...')

      const tokenResponse = await exchangeAuthCode({
        code,
        codeVerifier,
        redirectUri,
        scope: oauthTransaction.scope,
      })

      const { workerId, userName } = tokenResponse
      if (!workerId) {
        throw new Error('The token response does not contain the workerId claim.')
      }

      const nextSession: AppSession = {
        idTokenHint: tokenResponse.id_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        workerId,
        userName,
      }

      // Subscribe the authenticated worker to webhook notifications immediately
      // after login so the app starts receiving schedule/module change events.
      // A failure here is non-fatal: the app continues to work, but real-time
      // updates via webhook will not be received until the next login.
      setCallbackMessage('Subscribing to webhook updates...')
      try {
        await subscribeToWebhook()
      } catch (subscribeError) {
        console.warn('[auth] Webhook subscription failed, continuing without it', subscribeError)
        setWebhookSubscriptionFailed(true)
      }

      clearOAuthTransaction()

      onSessionCreated(nextSession)
      
      navigate('/', { replace: true })
    } catch (callbackError) {
      clearAuthCallbackExchangeKey()
      const message = callbackError instanceof Error
        ? callbackError.message
        : 'Unable to complete login callback.'
      setCallbackMessage(message)
      onError(callbackError)
    }
  }, [location.search, navigate, onSessionCreated, onError])

  useEffect(() => {
    if (location.pathname !== '/auth/callback') {
      return
    }

    void completeLogin()
  }, [location.pathname, completeLogin])

  return { callbackMessage, webhookSubscriptionFailed }
}

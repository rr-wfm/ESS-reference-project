import { useCallback } from 'react'
import { getAuthConfig } from '../services/apiClient'
import { createAuthorizationRequest } from '../services/authFlowService'
import {
  clearAuthCallbackExchangeKey,
  saveOAuthTransaction,
} from '../services/sessionService'

type UseLoginProps = {
  onError: (error: unknown) => void
}

export function useLogin({ onError }: UseLoginProps) {
  const startLogin = useCallback(async (): Promise<void> => {
    try {
      const authConfig = await getAuthConfig()
      const { authorizationUrl, state, codeVerifier } = await createAuthorizationRequest(authConfig)

      saveOAuthTransaction({
        state,
        codeVerifier,
        redirectUri: authConfig.redirectUri,
        scope: authConfig.scope,
      })
      clearAuthCallbackExchangeKey()

      globalThis.location.assign(authorizationUrl)
    } catch (startError) {
      onError(startError)
    }
  }, [onError])

  return { startLogin }
}

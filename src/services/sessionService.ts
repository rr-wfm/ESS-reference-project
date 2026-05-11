import type { AppSession } from '../types'

export const SESSION_STORAGE_KEY = 'ess.app.session'
export const AUTH_CALLBACK_EXCHANGE_KEY = 'ess.oauth.code.exchangeKey'
const OAUTH_TRANSACTION_KEY = 'ess.oauth.transaction'

type OAuthTransaction = {
  state: string
  codeVerifier: string
  redirectUri: string
  scope?: string | null
}

export function saveSession(session: AppSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function readSession(): AppSession | null {
  const value = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as AppSession
  } catch {
    return null
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function saveOAuthTransaction(transaction: OAuthTransaction): void {
  localStorage.setItem(OAUTH_TRANSACTION_KEY, JSON.stringify(transaction))
}

export function readOAuthTransaction(): OAuthTransaction | null {
  const value = localStorage.getItem(OAUTH_TRANSACTION_KEY)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as OAuthTransaction
  } catch {
    return null
  }
}

export function clearOAuthTransaction(): void {
  localStorage.removeItem(OAUTH_TRANSACTION_KEY)
}

export function getAuthCallbackExchangeKey(): string | null {
  return localStorage.getItem(AUTH_CALLBACK_EXCHANGE_KEY)
}

export function saveAuthCallbackExchangeKey(value: string): void {
  localStorage.setItem(AUTH_CALLBACK_EXCHANGE_KEY, value)
}

export function clearAuthCallbackExchangeKey(): void {
  localStorage.removeItem(AUTH_CALLBACK_EXCHANGE_KEY)
}

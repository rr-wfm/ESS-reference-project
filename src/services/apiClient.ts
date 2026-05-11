import type { LocalAuthConfig, StoredWebhookEvent, TokenResponse } from '../types'
import { parseJsonResponse } from './apiUtils'

const LOCAL_BASE = import.meta.env.VITE_LOCAL_API_BASE ?? '/api'

export async function getAuthConfig(): Promise<LocalAuthConfig> {
  const response = await fetch(`${LOCAL_BASE}/auth/config`)
  return parseJsonResponse<LocalAuthConfig>(response)
}

export async function exchangeAuthCode(payload: {
  code: string
  codeVerifier: string
  redirectUri: string
  scope?: string | null
}): Promise<TokenResponse> {
  const response = await fetch(`${LOCAL_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseJsonResponse<TokenResponse>(response)
}

export async function refreshAccessToken(): Promise<TokenResponse> {
  // grant_type signals refresh to the server. The actual refresh token is
  // read from the server-side session via the HttpOnly cookie — it is never
  // sent to the browser.
  const response = await fetch(`${LOCAL_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token' }),
  })

  return parseJsonResponse<TokenResponse>(response)
}

export async function signOutSession(): Promise<void> {
  await fetch(`${LOCAL_BASE}/auth/logout`, { method: 'POST' })
}

export async function getWebhookEvents(): Promise<StoredWebhookEvent[]> {
  const response = await fetch(`${LOCAL_BASE}/webhook/v1/events`)
  return parseJsonResponse<StoredWebhookEvent[]>(response)
}

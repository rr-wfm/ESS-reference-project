import * as oauth from 'oauth4webapi'
import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { ServerConfig } from '../config'
import { readJson } from '../http'
import { createSession, deleteSession, getSession, updateSession } from '../sessionStore'
import type { TokenRequestPayload } from '../types'

const SESSION_COOKIE = 'ess.session'

// These claim names are specific to the R&R identity provider.
const WORKER_CLAIM = 'urn:www-rrwfm-com:api/claims/workerid'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
let cachedAuthServer: { server: oauth.AuthorizationServer; expiresAt: number } | null = null
const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000

async function loadAuthorizationServer(config: ServerConfig): Promise<oauth.AuthorizationServer> {
  if (cachedAuthServer && Date.now() < cachedAuthServer.expiresAt) {
    return cachedAuthServer.server
  }

  const issuer = new URL(config.idpUrl)
  const response = await oauth.discoveryRequest(issuer)
  const server = await oauth.processDiscoveryResponse(issuer, response)
  cachedAuthServer = { server, expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS }
  return server
}

// Decode a JWT payload without signature verification — used only to extract custom claims
// from the access token as a fallback when they are absent from the validated ID token.
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payloadBase64] = token.split('.')
    if (!payloadBase64) return {}
    const base64 = payloadBase64.replaceAll('-', '+').replaceAll('_', '/')
    const padding = (4 - (base64.length % 4)) % 4
    return JSON.parse(atob(`${base64}${'='.repeat(padding)}`)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function getClaimValue(payload: Record<string, unknown>, claimName: string): string | undefined {
  for (const [key, value] of Object.entries(payload)) {
    if (key.trim().toLowerCase() === claimName.toLowerCase()) {
      return typeof value === 'string' ? value : undefined
    }
  }
  return undefined
}

function extractClaims(tokens: oauth.TokenEndpointResponse): { workerId?: string; userName?: string } {
  // Use validated ID token claims as the primary source when available.
  const idClaims = oauth.getValidatedIdTokenClaims(tokens)
  const fromIdToken = (claim: string): string | undefined => {
    const val = idClaims?.[claim]
    return typeof val === 'string' ? val : undefined
  }

  // Fall back to decoding the access token payload for R&R-specific claims.
  const accessPayload = decodeJwtPayload(tokens.access_token)
  const fromAccessToken = (claim: string) => getClaimValue(accessPayload, claim)

  return {
    workerId: fromIdToken(WORKER_CLAIM) ?? fromAccessToken(WORKER_CLAIM),
    userName: fromIdToken(NAME_CLAIM) ?? fromAccessToken(NAME_CLAIM),
  }
}

export function createAuthController(config: ServerConfig) {
  const controller = new Hono()

  controller.get('/config', async (c) => {
    let server: oauth.AuthorizationServer
    try {
      server = await loadAuthorizationServer(config)
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : 'OpenID discovery failed' }, 502)
    }

    return c.json({
      idpUrl: config.idpUrl,
      clientId: config.clientId,
      scope: config.scope,
      acrValues: config.acrValuesFromEnv || undefined,
      redirectUri: config.redirectUriFromEnv ?? 'http://localhost:5173/auth/callback',
      authorizationEndpoint: server.authorization_endpoint,
    })
  })

  // POST /token dispatches to the appropriate grant handler based on grant_type.
  controller.post('/token', async (c) => {
    const payload = await readJson<TokenRequestPayload>(c.req.raw)

    if (payload?.grant_type === 'refresh_token') {
      return handleRefreshGrant(c, config)
    }

    return handleAuthCodeGrant(c, config, payload ?? null)
  })

  controller.post('/logout', (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE)
    if (sessionId) {
      deleteSession(sessionId)
    }
    deleteCookie(c, SESSION_COOKIE, { path: '/api' })
    return c.json({ ok: true })
  })

  return controller
}

async function handleRefreshGrant(c: Context, config: ServerConfig): Promise<Response> {
  // The refresh token is kept server-side; the client only holds the session cookie.
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    return c.json({ error: 'No active session cookie' }, 401)
  }

  const serverSession = getSession(sessionId)
  if (!serverSession?.refreshToken) {
    return c.json({ error: 'Session not found or does not support refresh' }, 401)
  }

  let server: oauth.AuthorizationServer
  try {
    server = await loadAuthorizationServer(config)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'OpenID discovery failed' }, 502)
  }

  const client: oauth.Client = { client_id: config.clientId }
  const clientAuth = oauth.ClientSecretBasic(config.clientSecret)

  let tokens: oauth.TokenEndpointResponse
  try {
    const response = await oauth.refreshTokenGrantRequest(server, client, clientAuth, serverSession.refreshToken)
    tokens = await oauth.processRefreshTokenResponse(server, client, response)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Token refresh failed' }, 400)
  }

  updateSession(sessionId, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? serverSession.refreshToken,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  })

  const { workerId, userName } = extractClaims(tokens)

  return c.json({
    id_token: tokens.id_token,
    expires_in: tokens.expires_in ?? 3600,
    workerId,
    userName,
  })
}

async function handleAuthCodeGrant(
  c: Context,
  config: ServerConfig,
  payload: TokenRequestPayload | null,
): Promise<Response> {
  if (!payload?.code || !payload.codeVerifier || !payload.redirectUri) {
    return c.json({ error: 'code, codeVerifier, and redirectUri are required' }, 400)
  }

  let server: oauth.AuthorizationServer
  try {
    server = await loadAuthorizationServer(config)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'OpenID discovery failed' }, 502)
  }

  const client: oauth.Client = { client_id: config.clientId }

  // oauth4webapi requires callbackParameters to be a branded URLSearchParams produced
  // by validateAuthResponse(). In this hybrid flow the frontend already validated the
  // callback and sends only the code, so we build the token request manually and let
  // ClientSecretBasic apply the Authorization header the same way the library would.
  let tokens: oauth.TokenEndpointResponse
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: payload.code,
      redirect_uri: payload.redirectUri,
      code_verifier: payload.codeVerifier,
    })
    if (payload.scope) body.set('scope', payload.scope)

    const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' })
    await oauth.ClientSecretBasic(config.clientSecret)(server, client, body, headers)

    if (!server.token_endpoint) throw new Error('Authorization server does not expose a token endpoint.')
    const response = await fetch(server.token_endpoint, { method: 'POST', headers, body })
    tokens = await oauth.processAuthorizationCodeResponse(server, client, response)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Token exchange failed' }, 400)
  }

  const sessionId = createSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  })

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/api',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400,
  })

  const { workerId, userName } = extractClaims(tokens)

  return c.json({
    id_token: tokens.id_token,
    expires_in: tokens.expires_in ?? 3600,
    workerId,
    userName,
  })
}

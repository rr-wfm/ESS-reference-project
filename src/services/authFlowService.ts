import type { LocalAuthConfig } from '../types'
import {
  calculatePKCECodeChallenge,
  generateRandomCodeVerifier,
  generateRandomState,
  validateAuthResponse,
} from 'oauth4webapi'

type OidcAuthorizationRequest = {
  authorizationUrl: string
  state: string
  codeVerifier: string
}

type ValidateAuthorizationResponseParams = {
  authConfig: LocalAuthConfig
  search: string
  expectedState: string
}

function toAuthorizationServer(authConfig: LocalAuthConfig) {
  return {
    issuer: authConfig.idpUrl,
    authorization_endpoint: authConfig.authorizationEndpoint,
  }
}

function toClient(authConfig: LocalAuthConfig) {
  return {
    client_id: authConfig.clientId,
  }
}

export async function createAuthorizationRequest(
  authConfig: LocalAuthConfig,
): Promise<OidcAuthorizationRequest> {
  const codeVerifier = generateRandomCodeVerifier()
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)
  const state = generateRandomState()
  const authorizationUrl = buildAuthorizationUrl(authConfig, codeChallenge, state)

  return {
    authorizationUrl,
    state,
    codeVerifier,
  }
}

export function validateAuthorizationCodeResponse({
  authConfig,
  search,
  expectedState,
}: ValidateAuthorizationResponseParams): string {
  const parameters = validateAuthResponse(
    toAuthorizationServer(authConfig),
    toClient(authConfig),
    new URLSearchParams(search),
    expectedState,
  )

  const code = parameters.get('code')
  if (!code) {
    throw new Error('Authorization callback did not include an authorization code.')
  }

  return code
}

export function buildAuthorizationUrl(
  authConfig: LocalAuthConfig,
  codeChallenge: string,
  state: string,
): string {
  const authorizationUrl = new URL(authConfig.authorizationEndpoint)
  authorizationUrl.searchParams.set('client_id', authConfig.clientId)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('redirect_uri', authConfig.redirectUri)
  authorizationUrl.searchParams.set('scope', authConfig.scope)
  authorizationUrl.searchParams.set('code_challenge', codeChallenge)
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')
  authorizationUrl.searchParams.set('state', state)

  if (authConfig.acrValues?.trim()) {
    authorizationUrl.searchParams.set('acr_values', authConfig.acrValues.trim())
  }

  return authorizationUrl.toString()
}

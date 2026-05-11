import { jwtDecode } from 'jwt-decode'

type JwtPayload = Record<string, unknown>

const WORKER_CLAIM = 'urn:www-rrwfm-com:api/claims/workerid'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

export function decodeJwtPayload(token?: string): JwtPayload | undefined {
  if (!token) {
    return undefined
  }

  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return undefined
  }
}

function getClaimValue(payload: JwtPayload, claimName: string): string | undefined {
  for (const [key, value] of Object.entries(payload)) {
    if (key.trim().toLowerCase() === claimName.toLowerCase()) {
      return typeof value === 'string' ? value : undefined
    }
  }
  return undefined
}

export function extractWorkerId(accessToken?: string, idToken?: string): string | undefined {
  const accessPayload = decodeJwtPayload(accessToken)
  if (accessPayload) {
    const claim = getClaimValue(accessPayload, WORKER_CLAIM)
    if (claim) {
      return claim
    }
  }

  const idPayload = decodeJwtPayload(idToken)
  if (idPayload) {
    return getClaimValue(idPayload, WORKER_CLAIM)
  }

  return undefined
}

export function extractUserName(accessToken?: string, idToken?: string): string | undefined {
  const accessPayload = decodeJwtPayload(accessToken)
  if (accessPayload) {
    const claim = getClaimValue(accessPayload, NAME_CLAIM)
    if (claim) {
      return claim
    }
  }

  const idPayload = decodeJwtPayload(idToken)
  if (idPayload) {
    return getClaimValue(idPayload, NAME_CLAIM)
  }

  return undefined
}

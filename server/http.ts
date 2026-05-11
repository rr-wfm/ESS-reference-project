export async function readJson<T>(request: Request): Promise<T | undefined> {
  try {
    return (await request.json()) as T
  } catch {
    return undefined
  }
}

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// TLS verification is only enforced when NODE_ENV=production, allowing self-signed certificates
// on local ESS instances during development. Set NODE_ENV=production to enable it.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
const rejectUnauthorized = env.NODE_ENV === 'production'

export function fetchWithInsecureTls(input: string, init: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    tls: { rejectUnauthorized },
  } as RequestInit & { tls: { rejectUnauthorized: boolean } })
}

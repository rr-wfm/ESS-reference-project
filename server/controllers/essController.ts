import { Hono, type Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { fetchWithInsecureTls, jsonResponse, readJson } from '../http'
import { getSession } from '../sessionStore'

const SESSION_COOKIE = 'ess.session'

function requireSession(c: Context): { authorization: string } | { error: Response } {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    return { error: new Response(JSON.stringify({ error: 'No active session' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) }
  }

  const session = getSession(sessionId)
  if (!session) {
    return { error: new Response(JSON.stringify({ error: 'Session not found' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) }
  }

  return { authorization: `Bearer ${session.accessToken}` }
}

export function createEssController(essBaseUrl: string) {
  const controller = new Hono()

  controller.post('/webhook/v1/subscribe', async (c) => {
    const auth = requireSession(c)
    if ('error' in auth) {
      return auth.error
    }

    const targetUrl = `${essBaseUrl}/webhook/v1/subscribe`
    console.log(`[subscribe] -> POST ${targetUrl}`)

    const essResponse = await fetchWithInsecureTls(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: auth.authorization,
        'Content-Type': 'application/json',
      },
    })

    const bodyText = await essResponse.text()
    console.log(`[subscribe] <- ${essResponse.status} ${essResponse.statusText}`)
    console.log(`[subscribe] response body: ${bodyText || '(empty)'}`)

    if (!essResponse.ok) {
      let errorBody: unknown
      try { errorBody = JSON.parse(bodyText) } catch { errorBody = { error: bodyText || 'Subscribe request failed', status: essResponse.status } }
      return jsonResponse(errorBody, essResponse.status)
    }

    if (!bodyText) {
      return jsonResponse({}, essResponse.status)
    }

    return jsonResponse(JSON.parse(bodyText) as Record<string, unknown>, essResponse.status)
  })

  controller.post('/by-uri', async (c) => {
    const auth = requireSession(c)
    if ('error' in auth) {
      return auth.error
    }

    const payload = await readJson<{ uri?: string }>(c.req.raw)
    const uri = payload?.uri?.trim()
    if (!uri) {
      return c.json({ error: 'uri is required' }, 400)
    }

    const normalizedBase = essBaseUrl.replace(/\/$/, '')
    if (!uri.startsWith(normalizedBase)) {
      return c.json({ error: 'uri must target the configured ESS_BASE_URL' }, 400)
    }

    console.log(`[ess-by-uri] -> GET ${uri}`)
    const essResponse = await fetchWithInsecureTls(uri, {
      method: 'GET',
      headers: {
        Authorization: auth.authorization,
        'Content-Type': 'application/json',
      },
    })

    const bodyText = await essResponse.text()
    console.log(`[ess-by-uri] <- ${essResponse.status} ${essResponse.statusText}`)

    if (!essResponse.ok) {
      let errorBody: unknown
      try { errorBody = JSON.parse(bodyText) } catch { errorBody = { error: bodyText || 'Request failed', status: essResponse.status } }
      return jsonResponse(errorBody, essResponse.status)
    }

    if (!bodyText) {
      return jsonResponse({}, essResponse.status)
    }

    return jsonResponse(JSON.parse(bodyText) as Record<string, unknown>, essResponse.status)
  })

  controller.get('/*', async (c) => {
    const auth = requireSession(c)
    if ('error' in auth) {
      return auth.error
    }

    const incomingPath = new URL(c.req.url).pathname
    const essPath = incomingPath.replace(/^\/api\/ess/, '')
    const targetUrl = `${essBaseUrl}${essPath}`
    console.log(`[ess-proxy] -> GET ${targetUrl}`)

    const essResponse = await fetchWithInsecureTls(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: auth.authorization,
        'Content-Type': 'application/json',
      },
    })

    const bodyText = await essResponse.text()
    console.log(`[ess-proxy] <- ${essResponse.status} ${essResponse.statusText}`)

    if (!essResponse.ok) {
      let errorBody: unknown
      try { errorBody = JSON.parse(bodyText) } catch { errorBody = { error: bodyText || 'Request failed', status: essResponse.status } }
      return jsonResponse(errorBody, essResponse.status)
    }

    if (!bodyText) {
      return jsonResponse({}, essResponse.status)
    }

    return jsonResponse(JSON.parse(bodyText) as Record<string, unknown>, essResponse.status)
  })

  return controller
}

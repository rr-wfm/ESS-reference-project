import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie } from 'hono/cookie'
import { loadServerConfig } from './config'
import { createAuthController } from './controllers/authController'
import { createEssController } from './controllers/essController'
import { createHealthController } from './controllers/healthController'
import { createWebhookController } from './controllers/webhookController'
import { getSession } from './sessionStore'

const app = new Hono()
const config = loadServerConfig()
const SESSION_COOKIE = 'ess.session'
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

const publicRoutes = new Set<string>([
  '/api/auth/config',
  '/api/auth/token',
])

app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return next()
  }

  const path = c.req.path

  if (path === '/api/webhook/v1/receive') {
    if (!config.webhookReceiveApiKey) {
      return c.json({ error: 'WEBHOOK_API_KEY is not configured on the server' }, 500)
    }

    const token = c.req.header('Authorization')
    if (!token || token !== config.webhookReceiveApiKey) {
      return c.json({ error: 'Invalid or missing webhook API key' }, 401)
    }

    return next()
  }

  if (publicRoutes.has(path)) {
    return next()
  }

  const sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    return c.json({ error: 'No active session cookie' }, 401)
  }

  const session = getSession(sessionId)
  if (!session) {
    return c.json({ error: 'Session not found' }, 401)
  }

  return next()
})

app.route('/api', createHealthController())
app.route('/api/auth', createAuthController(config))
app.route('/api/ess', createEssController(config.essBaseUrl))
app.route('/api/webhook', createWebhookController())

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((error, c) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error'
  return c.json({ error: message }, 500)
})

const bunRuntime = (globalThis as {
  Bun?: {
    serve: (options: { port: number; fetch: typeof app.fetch }) => unknown
  }
}).Bun

if (!bunRuntime) {
  throw new Error('Bun runtime is required to start this server.')
}

bunRuntime.serve({
  port: Number(env.BUN_SERVER_PORT ?? 3001),
  fetch: app.fetch,
})

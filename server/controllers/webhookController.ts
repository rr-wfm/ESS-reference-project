import { Hono } from 'hono'
import { readJson } from '../http'
import type { StoredWebhookEvent, WebhookEventPayload } from '../types'

export function createWebhookController() {
  const controller = new Hono()
  const events: StoredWebhookEvent[] = []
  let eventId = 1

  controller.post('/v1/receive', async (c) => {
    const payload = await readJson<{ events?: WebhookEventPayload[] }>(c.req.raw)

    if (!payload?.events || !Array.isArray(payload.events)) {
      return c.json({ error: 'Payload must contain an events array' }, 400)
    }

    const receivedAt = new Date().toISOString()

    for (const item of payload.events) {
      events.push({
        ...item,
        id: eventId,
        receivedAt,
      })
      eventId += 1
    }

    return c.json({ received: payload.events.length }, 202)
  })

  controller.get('/v1/events', (c) => {
    const ordered = [...events].sort((a, b) => a.id - b.id)
    return c.json(ordered)
  })

  return controller
}

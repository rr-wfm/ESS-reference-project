import { Hono } from 'hono'

export function createHealthController() {
  const controller = new Hono()

  controller.get('/health', (c) => c.json({ ok: true }))

  return controller
}

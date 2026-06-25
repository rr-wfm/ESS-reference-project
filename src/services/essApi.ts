// All requests go through the local Bun proxy at /api/ess to avoid CORS.
// The proxy reads the access token from the server-side session via the HttpOnly cookie.
import type { ScheduleDataContract, WorkedHoursDataContract, WorkerModuleAuthorizationResponse } from '../types'
import { parseApiResponse } from './apiUtils'

export async function subscribeToWebhook(): Promise<void> {
  const response = await fetch('/api/ess/webhook/v1/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  await parseApiResponse<unknown>(response)
}

export async function fetchModules(workerId: string): Promise<WorkerModuleAuthorizationResponse[]> {
  const response = await fetch(`/api/ess/modules/v1/${encodeURIComponent(workerId)}`)
  return parseApiResponse<WorkerModuleAuthorizationResponse[]>(response)
}

export async function fetchSchedule(workerId: string): Promise<ScheduleDataContract | null> {
  const response = await fetch(`/api/ess/scheduling/v1/${encodeURIComponent(workerId)}`)

  if (response.status === 204) {
    return null
  }

  return parseApiResponse<ScheduleDataContract>(response)
}

export async function fetchWorkedHours(workerId: string): Promise<WorkedHoursDataContract | null> {
  const response = await fetch(`/api/ess/worked-hours/v1/${encodeURIComponent(workerId)}`)

  if (response.status === 204) {
    return null
  }

  return parseApiResponse<WorkedHoursDataContract>(response)
}

export async function fetchByUri(uri: string): Promise<unknown> {
  const response = await fetch('/api/ess/by-uri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uri }),
  })

  return parseApiResponse<unknown>(response)
}

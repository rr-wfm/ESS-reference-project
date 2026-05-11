export type WorkerModuleAuthorizationResponse = {
  validFrom: string
  validUntil?: string | null
  modules: string[]
}

export type IsoWeek = {
  year: number
  week: number
}

export type Shift = {
  shiftId: string
  startTime: string
  endTime: string
  workerId: string
  worker: string
  license: string
  organizationalUnit: string
  activity: string
  shiftDurationMinutes?: number
  pauseDurationMinutes?: number
  remark?: string | null
}

export type WorkerSchedule = {
  shifts: Shift[]
}

export type OrganizationalUnitSchedule = {
  organizationalUnit: string
  shifts: Shift[]
}

export type WeekSchedule = {
  week: IsoWeek
  workerSchedule: WorkerSchedule
  organizationalUnitSchedules?: OrganizationalUnitSchedule[]
}

export type ScheduleDataContract = {
  weeks: WeekSchedule[]
}

export type TokenResponse = {
  id_token?: string
  expires_in: number
  workerId: string
  userName?: string
}

export type WebhookEventPayload = {
  scope: {
    workerId: string
    uri: string
    period?: {
      from: string
      until: string
    }
  }
  event: {
    timestamp: string
    type: string
    action: string
  }
}

export type StoredWebhookEvent = WebhookEventPayload & {
  id: number
  receivedAt: string
}

export type LocalAuthConfig = {
  idpUrl: string
  clientId: string
  scope: string
  redirectUri: string
  authorizationEndpoint: string
  acrValues?: string
}

export type AppSession = {
  idTokenHint?: string
  expiresAt?: number
  workerId: string
  userName?: string
}

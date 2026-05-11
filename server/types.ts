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

export type TokenRequestPayload = {
  grant_type?: string
  code?: string
  codeVerifier?: string
  redirectUri?: string
  scope?: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} in environment.`)
  return value
}

export type ServerConfig = {
  idpUrl: string
  clientId: string
  clientSecret: string
  scope: string
  acrValuesFromEnv?: string
  redirectUriFromEnv?: string
  essBaseUrl: string
  webhookReceiveApiKey?: string
}

export function loadServerConfig(): ServerConfig {
  return {
    idpUrl: getRequiredEnv('IDP_URL'),
    clientId: getRequiredEnv('IDP_CLIENT_ID'),
    clientSecret: getRequiredEnv('IDP_CLIENT_SECRET'),
    scope: process.env.IDP_SCOPE ?? 'openid profile ess',
    acrValuesFromEnv: process.env.IDP_ACR_VALUES?.trim() || undefined,
    redirectUriFromEnv: process.env.IDP_REDIRECT_URI,
    essBaseUrl: process.env.ESS_BASE_URL ?? 'https://ess.gat.rr-wfm.com',
    webhookReceiveApiKey: process.env.WEBHOOK_API_KEY,
  }
}

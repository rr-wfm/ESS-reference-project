# ESS Reference App

Reference implementation for ESS API platform integration.

## API Documentation

The full functional API documentation for the ESS platform is available at [api-docs.rr-wfm.com/docs/ess](https://api-docs.rr-wfm.com/docs/ess/). Consult it for endpoint specifications, request/response schemas, and webhook event types.

## What You Need

- Bun 1.3 or later: https://bun.sh
- Access to an R&R ESS environment
- OAuth client credentials from R&R support

## 1) Request Client Credentials

If you do not have credentials yet, send a request to [support@rr-wfm.com](mailto:support@rr-wfm.com).

Include the following information in your request:

- Intended redirect URI(s), for example: `http://localhost:5173/auth/callback`
- Contact email address(es) for the integration
- Whether you want to request an account for the R&R JobApp as well

## 2) Configure Environment Variables

Create a `.env` file in this folder based on `.env.example`.

```env
IDP_URL=https://ess.gat.rr-wfm.com/identity
IDP_CLIENT_ID=your-client-id
IDP_CLIENT_SECRET=your-client-secret
IDP_SCOPE=openid ess offline_access
IDP_ACR_VALUES=
IDP_REDIRECT_URI=http://localhost:5173/auth/callback
ESS_BASE_URL=https://ess.gat.rr-wfm.com
BUN_SERVER_PORT=3001
WEBHOOK_API_KEY=replace-with-long-random-secret
```

Required values:

- `IDP_URL`
- `IDP_CLIENT_ID`
- `IDP_CLIENT_SECRET`
- `ESS_BASE_URL`
- `WEBHOOK_API_KEY`

Important:

- Keep `offline_access` in `IDP_SCOPE` so refresh tokens are issued.
- `IDP_REDIRECT_URI` must match the redirect URI registered for your client. The redirect uri for this reference app is by default `http://localhost:5173/auth/callback`
- `scope.uri` in webhook test payloads must use the same host as `ESS_BASE_URL`.
- Use a long random value for `WEBHOOK_API_KEY`. This value is required as `Authorization: <WEBHOOK_API_KEY>` when calling `POST /api/webhook/v1/receive`.
- `IDP_ACR_VALUES` is optional. When set, the value is forwarded as the `acr_values` parameter in the OpenID Connect authorization request sent to the R&R identity provider. IdentityServer treats `acr_values` as additional authentication context — it can be used, for example, to trigger a specific authentication method or to pass a tenant hint for your external identity provider. Leave it empty unless R&R has provided specific values for your integration.

## 3) Install and Run

In order to start the application, run the following commands:
```bash
bun install
bun run start
```

This starts:

- Frontend (Vite): `http://localhost:5173`
- Local Bun API/proxy server: `http://localhost:3001`

## 4) Sign In and Validate Basic Flow

1. Open `http://localhost:5173`
2. Click Login
3. Complete sign-in with the credentials for the R&R JobApp.
    > When configured by R&R, you can use acr_values to perform the sign in on your external identityprovider
4. Confirm the app loads modules/schedule data

Quick health check:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "ok": true
}
```

## 5) Subscribe Workers to Webhook Notifications

Before ESS will deliver webhook events to your endpoint, you must enroll each worker you want to track. Your integration's notification scope is bounded by the R&R customer it was set up for — you will only ever receive notifications for workers within that customer's scope, as determined by the credentials issued to you. Within that scope, notifications are opt-in per worker: you must explicitly subscribe each worker to activate delivery.

To enroll a worker, send a POST request while authenticated (the app will attach your access token automatically):

```bash
curl -X POST http://localhost:3001/api/ess/webhook/v1/subscribe \
  -H "Content-Type: application/json" \
  --cookie "ess.session=<your-session-cookie>"
```

The server forwards the request to the ESS API at `{ESS_BASE_URL}/webhook/v1/subscribe`. Consult the ESS API documentation for the required body fields (such as worker identifiers and the webhook URL to register).

> You must be signed in before calling this endpoint. The session cookie is set automatically by the browser after login; for curl testing, copy it from your browser's developer tools.

## 6) Test Webhooks with Postman

Use this to simulate webhook delivery during local development.

1. Create a new request in Postman
2. Method: `POST`
3. URL: `http://localhost:3001/api/webhook/v1/receive`
4. Headers:
  - `Content-Type: application/json`
  - `Authorization: <WEBHOOK_API_KEY>`
5. Body type: `raw` -> `JSON`
6. Use payload:

```json
{
  "events": [
    {
      "scope": {
        "workerId": "GREEN10-67890",
        "uri": "https://ess.gat.rr-wfm.com/scheduling/v1/GREEN10-67890",
        "period": {
          "from": "2024-01-01",
          "until": "2024-01-07"
        }
      },
      "event": {
        "timestamp": "2024-01-01T12:00:00Z",
        "type": "schedule",
        "action": "finalized"
      }
    }
  ]
}
```

Or use curl:
```bash
curl -X POST http://localhost:3001/api/webhook/v1/receive \
  -H "Content-Type: application/json" \
  -H "Authorization: <WEBHOOK_API_KEY>" \
  -d '{
    "events": [
      {
        "scope": {
          "workerId": "GREEN10-67890",
          "uri": "https://ess.gat.rr-wfm.com/scheduling/v1/GREEN10-67890",
          "period": {"from": "2024-01-01", "until": "2024-01-07"}
        },
        "event": {
          "timestamp": "2024-01-01T12:00:00Z",
          "type": "schedule",
          "action": "finalized"
        }
      }
    ]
  }'
```

7. Click Send

## 7) Test Webhooks Over the Internet (ngrok or dev tunnels)

Use this when ESS or another remote sender must deliver webhook payloads to your local machine.

### Option A: ngrok

1. Start the app locally (`bun run start`) so the API listens on `http://localhost:3001`.
2. Start a tunnel to the API port:

```bash
ngrok http 3001
```

3. Copy the HTTPS forwarding URL from ngrok, for example `https://rr-example.ngrok-free.app`.
4. Add a webhook with the following URL for the client in R&R:

```text
https://rr-example.ngrok-free.app/api/webhook/v1/receive
```

5. Include header:

```text
Authorization: <WEBHOOK_API_KEY>
```

### Option B: dev tunnels

1. Start the app locally (`bun run start`) so the API listens on `http://localhost:3001`.
2. Create and start a tunnel:

```bash
devtunnel host -a -p 3001
```

3. Copy the generated HTTPS URL.
4. Add a webhook with the following URL for the client in R&R:

```text
https://<your-devtunnel-host>/api/webhook/v1/receive
```

5. Include header:

```text
Authorization: <WEBHOOK_API_KEY>
```

Notes:

- Keep the tunnel process running while testing.
- For production-like testing, rotate `WEBHOOK_API_KEY` regularly and never share it publicly.

Expected response:

```json
{
  "received": 1
}
```

Verify stored events:

```bash
curl http://localhost:3001/api/webhook/v1/events
```

## Troubleshooting

- `invalid_client` during login:
  - Verify `IDP_CLIENT_ID` and `IDP_CLIENT_SECRET`.
- `invalid_grant` during token exchange:
  - Start login again and complete it quickly; authorization codes are one-time and short-lived.
- `Failed to load openid configuration (403)` from `GET /api/auth/config`:
  - Your IdP may block `.well-known/openid-configuration` from your network.
  - For R&R, these are usually `<IDP_URL>/connect/authorize` and `<IDP_URL>/connect/token`.
- App cannot fetch ESS data:
  - Verify `ESS_BASE_URL` and ensure webhook payload `scope.uri` uses the same ESS host.
- Port `3001` already in use:
  - Stop the process using that port or set `BUN_SERVER_PORT` to a different value.
- After restarting the Bun server, the browser shows `No active session` or `401` errors:
  - Sessions are stored in memory and are lost when the server restarts. Clear localStorage (`ess.app.session`) and the `ess.session` cookie in the browser, then log in again.

## Useful Endpoints

- `GET /api/health`
- `GET /api/auth/config`
- `POST /api/auth/token`
- `POST /api/ess/webhook/v1/subscribe` — enroll workers in your webhook subscription; proxied to the ESS API with your access token
- `GET /api/ess/modules/v1/{workerId}`
- `GET /api/ess/scheduling/v1/{workerId}`
- `POST /api/ess/by-uri` — fetch any ESS resource by its full URI (`{ "uri": "<ess-url>" }`); used after receiving a webhook to load updated data without triggering browser CORS restrictions
- `POST /api/webhook/v1/receive`
- `GET /api/webhook/v1/events`

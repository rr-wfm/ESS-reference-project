import { memo } from 'react'
import { formatDateTime } from '../lib/date'
import styles from './WebhooksPage.module.css'
import type { StoredWebhookEvent } from '../types'

type WebhooksPageProps = {
  events: StoredWebhookEvent[]
}

export const WebhooksPage = memo(function WebhooksPage({ events }: Readonly<WebhooksPageProps>) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Webhook Events</h2>
      <p className={styles.subtitle}>Stored in local in-memory DB and ordered by receive time.</p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Received</th>
              <th className={styles.th}>Worker ID</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Action</th>
              <th className={styles.th}>URI</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {events.map((item) => (
              <tr key={item.id}>
                <td className={styles.tdMono}>{item.id}</td>
                <td className={styles.td}>{formatDateTime(item.receivedAt)}</td>
                <td className={styles.td}>{item.scope.workerId}</td>
                <td className={styles.td}>{item.event.type}</td>
                <td className={styles.td}>{item.event.action}</td>
                <td className={styles.uri} title={item.scope.uri}>
                  {item.scope.uri}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length === 0 ? (
        <p className={styles.empty}>No webhook events received yet.</p>
      ) : null}
    </section>
  )
})

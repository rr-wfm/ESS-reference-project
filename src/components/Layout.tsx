import { memo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { FooterNav } from './FooterNav'
import styles from './Layout.module.css'

type LayoutProps = {
  onLogout: () => void
  workerId: string
  webhookSubscriptionFailed: boolean
}

export const Layout = memo(function Layout({
  workerId,
  onLogout,
  webhookSubscriptionFailed,
}: Readonly<LayoutProps>) {
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.left}>
          <img src="/logo.svg" alt="ESS logo" className={styles.logo} />
          <h1 className={styles.brandTitle}>ESS Demo Application</h1>
        </div>
        <span className={styles.workerBadge}>Worker ID: {workerId}</span>
        <div className={styles.right}>
          <button
            type="button"
            onClick={onLogout}
            className={styles.logout}
            aria-label="Logout"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {webhookSubscriptionFailed && !bannerDismissed && (
        <div className={styles.webhookBanner} role="alert">
          <span>Webhook subscription failed — real-time schedule updates will not be received. Re-login to retry.</span>
          <button
            type="button"
            className={styles.webhookBannerDismiss}
            aria-label="Dismiss"
            onClick={() => { setBannerDismissed(true) }}
          >
            ✕
          </button>
        </div>
      )}

      <main className={styles.main}>
        <Outlet />
      </main>

      <FooterNav />
    </div>
  )
})

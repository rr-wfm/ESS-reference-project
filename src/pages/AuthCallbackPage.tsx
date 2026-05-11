import { memo } from 'react'
import styles from './AuthCallbackPage.module.css'

type AuthCallbackPageProps = {
  message: string
}

export const AuthCallbackPage = memo(function AuthCallbackPage({
  message,
}: Readonly<AuthCallbackPageProps>) {
  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Completing sign-in</h1>
        <p className={styles.message}>{message}</p>
      </div>
    </section>
  )
})

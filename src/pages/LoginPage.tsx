import { memo, useCallback } from 'react'
import { useHref } from 'react-router-dom'
import styles from './LoginPage.module.css'

type LoginPageProps = {
  onLogin: () => Promise<void>
  loginError?: string
}

export const LoginPage = memo(function LoginPage({
  onLogin,
  loginError,
}: Readonly<LoginPageProps>) {
  const callbackPath = useHref('/auth/callback')
  const redirectUri = typeof document === 'undefined'
    ? `http://localhost:5173${callbackPath}`
    : new URL(callbackPath, document.baseURI).toString()

  const handleLogin = useCallback(() => {
    void onLogin()
  }, [onLogin])

  return (
    <section className={styles.section}>
      <div className={styles.panel}>
        <h1 className={styles.title}>ESS Demo Application</h1>
        <p className={styles.description}>
          Sign in using your configured Identity Provider to test the ESS module, scheduling,
          and webhook APIs.
        </p>
        <div className={styles.banner}>
          <p className={styles.bannerTitle}>Client Redirect URI</p>
          <p className={styles.bannerText}>
            Add the following URL to your client redirect URI configuration:
          </p>
          <code className={styles.bannerCode}>{redirectUri}</code>
        </div>
        <button
          type="button"
          onClick={handleLogin}
          className={styles.button}
        >
          Login with IdP
        </button>
        {loginError ? <p className={styles.error}>{loginError}</p> : null}
      </div>
    </section>
  )
})

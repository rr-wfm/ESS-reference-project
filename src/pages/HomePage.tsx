import { memo } from 'react'
import { ShiftCard } from '../components/ShiftCard'
import styles from './HomePage.module.css'
import type { Shift } from '../types'

type HomePageProps = {
  userName: string
  loading: boolean
  moduleNames: string[]
  nextShift?: Shift
  error?: string
}

export const HomePage = memo(function HomePage({
  userName,
  loading,
  moduleNames,
  nextShift,
  error,
}: Readonly<HomePageProps>) {
  return (
    <section className={styles.section}>
      <div className={styles.summaryCard}>
        <p className={styles.summaryLabel}>Worker</p>
        <h2 className={styles.summaryName}>{userName}</h2>
        <p className={styles.summaryMeta}>
          Modules active: {moduleNames.length ? moduleNames.join(', ') : 'none'}
        </p>
      </div>

      {loading ? <p className={styles.loading}>Loading module and schedule data...</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {nextShift ? (
        <ShiftCard shift={nextShift} />
      ) : (
        <article className={styles.emptyCard}>
          No upcoming shift available for this worker.
        </article>
      )}
    </section>
  )
})

import { memo } from 'react'
import { formatDateTime } from '../lib/date'
import styles from './ShiftCard.module.css'
import type { Shift } from '../types'

type ShiftCardProps = {
  shift: Shift
}

export const ShiftCard = memo(function ShiftCard({ shift }: Readonly<ShiftCardProps>) {
  return (
    <article className={styles.card}>
      <p className={styles.kicker}>Upcoming Shift</p>
      <h2 className={styles.title}>{shift.activity}</h2>
      <p className={styles.subtitle}>{shift.organizationalUnit}</p>
      <dl className={styles.grid}>
        <div>
          <dt className={styles.term}>Start</dt>
          <dd>{formatDateTime(shift.startTime)}</dd>
        </div>
        <div>
          <dt className={styles.term}>End</dt>
          <dd>{formatDateTime(shift.endTime)}</dd>
        </div>
        <div>
          <dt className={styles.term}>Worker</dt>
          <dd>{shift.worker}</dd>
        </div>
        <div>
          <dt className={styles.term}>License</dt>
          <dd>{shift.license}</dd>
        </div>
      </dl>
    </article>
  )
})

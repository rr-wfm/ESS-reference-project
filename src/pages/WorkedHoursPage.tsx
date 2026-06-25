import { memo, useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { formatDuration, getIsoWeek, toClockTime, weekKey } from '../lib/date'
import type { Absence, ClockedPeriod, Compensation, WorkedDay, WorkedHoursShift, WorkedWeek } from '../types'
import styles from './WorkedHoursPage.module.css'

// ===== Types =====

type WorkedHoursPageProps = {
  weeks: WorkedWeek[]
}

// ===== Sub-components =====

type WeekSelectorProps = {
  weeks: WorkedWeek[]
  selectedWeekKey: string
  onChange: (value: string) => void
}

const WeekSelector = memo(function WeekSelector({
  weeks,
  selectedWeekKey,
  onChange,
}: Readonly<WeekSelectorProps>) {
  return (
    <div className={`${styles.card} ${styles.cardPad}`}>
      <label htmlFor="worked-week" className={styles.weekLabel}>
        Select ISO Week
      </label>
      <select
        id="worked-week"
        className={styles.weekSelect}
        value={selectedWeekKey}
        onChange={(e) => onChange(e.target.value)}
        data-testid="week-selector"
      >
        {weeks.map((w) => {
          const key = weekKey(w.week)
          return (
            <option key={key} value={key}>
              {w.week.year}-W{String(w.week.week).padStart(2, '0')}
            </option>
          )
        })}
      </select>
    </div>
  )
})

type ClockedPeriodRowProps = {
  period: ClockedPeriod
}

const ClockedPeriodRow = memo(function ClockedPeriodRow({ period }: Readonly<ClockedPeriodRowProps>) {
  return (
    <div className={styles.clockedPeriod} data-testid="clocked-period">
      <div className={styles.clockedLine}>
        <span className={styles.clockedLabel}>Clocked in</span>
        <span className={styles.clockedTime}>{toClockTime(period.startTime)}</span>
      </div>
      {period.pauses.map((pause, i) => (
        <div key={i} className={styles.pauseLine} data-testid="pause-row">
          <span className={styles.pauseLabel}>Pause</span>
          <span className={styles.clockedTime}>
            {toClockTime(pause.startTime)} – {toClockTime(pause.endTime)}
          </span>
        </div>
      ))}
      <div className={styles.clockedLine}>
        <span className={styles.clockedLabel}>Clocked out</span>
        <span className={styles.clockedTime}>{toClockTime(period.endTime)}</span>
      </div>
    </div>
  )
})

type ClockedHoursDetailsProps = {
  clockedPeriods: ClockedPeriod[]
}

const ClockedHoursDetails = memo(function ClockedHoursDetails({
  clockedPeriods,
}: Readonly<ClockedHoursDetailsProps>) {
  return (
    <details className={styles.clockedDetails} data-testid="clocked-hours-details">
      <summary className={styles.clockedSummary}>
        <span>Clocked hours</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={styles.chevron}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className={styles.clockedContent}>
        {clockedPeriods.map((period, i) => (
          <ClockedPeriodRow key={i} period={period} />
        ))}
      </div>
    </details>
  )
})

type CompensationRowProps = {
  compensation: Compensation
}

const CompensationRow = memo(function CompensationRow({ compensation }: Readonly<CompensationRowProps>) {
  return (
    <div className={styles.compensationRow} data-testid="compensation-row">
      <span className={styles.compensationDesc}>{compensation.description}</span>
      <span className={styles.compensationDuration}>{formatDuration(compensation.durationMinutes)}</span>
    </div>
  )
})

type ShiftRowProps = {
  shift: WorkedHoursShift
}

const ShiftRow = memo(function ShiftRow({ shift }: Readonly<ShiftRowProps>) {
  const { workedHours, clockedHours } = shift

  return (
    <div className={styles.shiftRow} data-testid="shift-row">
      {workedHours && (
        <div className={styles.workedPeriod}>
          <span className={styles.shiftTime}>
            {toClockTime(workedHours.startTime)} – {toClockTime(workedHours.endTime)}
          </span>
          <span className={styles.shiftDuration}>{formatDuration(workedHours.durationMinutes)}</span>
        </div>
      )}
      {workedHours?.compensations?.map((comp, i) => (
        <CompensationRow key={i} compensation={comp} />
      ))}
      {clockedHours && clockedHours.clockedPeriods.length > 0 && (
        <ClockedHoursDetails clockedPeriods={clockedHours.clockedPeriods} />
      )}
    </div>
  )
})

type AbsenceRowProps = {
  absence: Absence
}

const AbsenceRow = memo(function AbsenceRow({ absence }: Readonly<AbsenceRowProps>) {
  return (
    <div className={styles.absenceRow} data-testid="absence-row">
      <span className={styles.absenceDesc}>{absence.description}</span>
      <span className={styles.absenceDuration}>{formatDuration(absence.durationMinutes)}</span>
    </div>
  )
})

type DayCardProps = {
  day: WorkedDay
}

const DayCard = memo(function DayCard({ day }: Readonly<DayCardProps>) {
  const dt = DateTime.fromISO(day.date)
  const label = dt.toFormat('ccc, LLL dd')

  return (
    <div className={styles.dayCard} data-testid={`day-card-${day.date}`}>
      <div className={styles.dayHeader}>
        <span className={styles.dayLabel}>{label}</span>
      </div>
      {day.shifts.map((shift, i) => (
        <ShiftRow key={i} shift={shift} />
      ))}
      {day.absences.map((absence, i) => (
        <AbsenceRow key={i} absence={absence} />
      ))}
    </div>
  )
})

type WeekSummaryProps = {
  workedDurationMinutes: number
  absenceDurationMinutes: number
  atvDurationMinutes?: number
  atvDescription?: string
}

const WeekSummary = memo(function WeekSummary({
  workedDurationMinutes,
  absenceDurationMinutes,
  atvDurationMinutes,
  atvDescription,
}: Readonly<WeekSummaryProps>) {
  return (
    <div className={`${styles.card} ${styles.cardPad} ${styles.summaryCard}`} data-testid="week-summary">
      <h3 className={styles.summaryTitle}>Week summary</h3>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Worked</span>
        <span className={styles.summaryValue}>{formatDuration(workedDurationMinutes)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>Absence</span>
        <span className={styles.summaryValue}>{formatDuration(absenceDurationMinutes)}</span>
      </div>
      {atvDurationMinutes != null && (
        <div className={styles.summaryRow} data-testid="atv-row">
          <span className={styles.summaryLabel}>{atvDescription ?? 'ATV'}</span>
          <span className={styles.summaryValue}>{formatDuration(atvDurationMinutes)}</span>
        </div>
      )}
    </div>
  )
})

// ===== Main Component =====

export const WorkedHoursPage = memo(function WorkedHoursPage({
  weeks = [],
}: Readonly<WorkedHoursPageProps>) {
  const currentWeekKey = useMemo(() => {
    const k = weekKey(getIsoWeek(new Date()))
    return weeks.some((w) => weekKey(w.week) === k) ? k : weeks[0] ? weekKey(weeks[0].week) : ''
  }, [weeks])

  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentWeekKey)

  // Reconcile selection when the weeks list changes (e.g. after a refetch) and the
  // current selection no longer exists — fall back to the current ISO week.
  useEffect(() => {
    if (!weeks.some((w) => weekKey(w.week) === selectedWeekKey)) {
      setSelectedWeekKey(currentWeekKey)
    }
  }, [weeks, selectedWeekKey, currentWeekKey])

  const selectedWeek = useMemo(
    () => weeks.find((w) => weekKey(w.week) === selectedWeekKey) ?? weeks[0],
    [weeks, selectedWeekKey],
  )

  const days = useMemo(
    () =>
      selectedWeek
        ? [...selectedWeek.days].sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [selectedWeek],
  )

  if (weeks.length === 0) {
    return (
      <section className={styles.section}>
        <p className={styles.message} data-testid="empty-no-weeks">
          You have not worked yet.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <WeekSelector weeks={weeks} selectedWeekKey={selectedWeekKey} onChange={setSelectedWeekKey} />

      {selectedWeek && !selectedWeek.hasWorkedHours ? (
        <p className={styles.message} data-testid="empty-no-worked-hours">
          You did not work this week.
        </p>
      ) : (
        <>
          <div className={styles.dayList} data-testid="day-list">
            {days.map((day) => (
              <DayCard key={day.date} day={day} />
            ))}
          </div>
          {selectedWeek && (
            <WeekSummary
              workedDurationMinutes={selectedWeek.summary.workedDurationMinutes}
              absenceDurationMinutes={selectedWeek.summary.absenceDurationMinutes}
              atvDurationMinutes={selectedWeek.summary.atvDurationMinutes}
              atvDescription={selectedWeek.summary.atvDescription}
            />
          )}
        </>
      )}
    </section>
  )
})

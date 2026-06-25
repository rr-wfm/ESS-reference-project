import { memo, useCallback, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { toClockTime, weekKey } from '../lib/date'
import styles from './SchedulingPage.module.css'
import type { OrganizationalUnitSchedule, Shift, WeekSchedule } from '../types'

type SchedulingPageProps = {
  weeks: WeekSchedule[]
  selectedWeekKey: string
  onSelectWeek: (value: string) => void
}

type SchedulingTab = 'worker' | 'organization'

// ===== Helper Functions =====

function groupByDate(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>()
  for (const shift of shifts) {
    const date = DateTime.fromISO(shift.startTime).toISODate()
    if (!date) continue
    const current = grouped.get(date) ?? []
    current.push(shift)
    grouped.set(date, current)
  }
  return grouped
}

function groupByEmployee(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>()
  for (const shift of shifts) {
    const key = shift.worker || shift.workerId
    const current = grouped.get(key) ?? []
    current.push(shift)
    grouped.set(key, current)
  }

  for (const [key, employeeShifts] of grouped.entries()) {
    grouped.set(
      key,
      [...employeeShifts].sort(
        (a, b) => DateTime.fromISO(a.startTime).toMillis() - DateTime.fromISO(b.startTime).toMillis(),
      ),
    )
  }
  return grouped
}

function uniqueDatesFromSchedules(schedules: OrganizationalUnitSchedule[]): string[] {
  const set = new Set<string>()
  for (const schedule of schedules) {
    for (const shift of schedule.shifts) {
      const date = DateTime.fromISO(shift.startTime).toISODate()
      if (date) set.add(date)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

function toDateLabel(value: string): string {
  return DateTime.fromISO(value).toFormat('ccc, yyyy LLL dd')
}

// ===== Sub-components =====

type WeekSelectorProps = {
  weeks: WeekSchedule[]
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
      <label htmlFor="week" className={styles.weekLabel}>
        Select ISO Week
      </label>
      <select
        id="week"
        className={styles.weekSelect}
        value={selectedWeekKey}
        onChange={(event) => onChange(event.target.value)}
      >
        {weeks.map((week) => {
          const key = weekKey(week.week)
          return (
            <option key={key} value={key}>
              {week.week.year}-W{String(week.week.week).padStart(2, '0')}
            </option>
          )
        })}
      </select>
    </div>
  )
})

type TabControlsProps = {
  activeTab: SchedulingTab
  onTabChange: (tab: SchedulingTab) => void
}

const TabControls = memo(function TabControls({
  activeTab,
  onTabChange,
}: Readonly<TabControlsProps>) {
  return (
    <div className={`${styles.card} ${styles.tabContainer}`}>
      <div className={styles.tabGrid}>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === 'worker' ? styles.tabButtonActive : styles.tabButtonInactive
          }`}
          onClick={() => onTabChange('worker')}
        >
          Employee Schedule
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${
            activeTab === 'organization' ? styles.tabButtonActive : styles.tabButtonInactive
          }`}
          onClick={() => onTabChange('organization')}
        >
          Org Unit Calendar
        </button>
      </div>
    </div>
  )
})

type ShiftChipProps = {
  shift: Shift
}

const ShiftChip = memo(function ShiftChip({ shift }: Readonly<ShiftChipProps>) {
  return (
    <li className={styles.shiftChip}>
      <div className={styles.shiftChipHeader}>
        <p className={styles.shiftChipTitle}>{shift.activity}</p>
        <p className={styles.shiftChipText}>
          {toClockTime(shift.startTime)} - {toClockTime(shift.endTime)}
        </p>
      </div>
      <p className={styles.shiftChipMeta}>
        {toDateLabel(shift.startTime)} - {shift.organizationalUnit}
      </p>
    </li>
  )
})

type WorkerScheduleTabProps = {
  shifts: Shift[]
}

const WorkerScheduleTab = memo(function WorkerScheduleTab({ shifts }: Readonly<WorkerScheduleTabProps>) {
  return (
    <section className={`${styles.card} ${styles.cardPad}`}>
      <ul className={styles.workerList}>
        {shifts.map((shift) => (
          <ShiftChip key={shift.shiftId} shift={shift} />
        ))}
      </ul>
    </section>
  )
})

type OrganizationUnitTableProps = {
  unit: OrganizationalUnitSchedule
}

const OrganizationUnitTable = memo(function OrganizationUnitTable({
  unit,
}: Readonly<OrganizationUnitTableProps>) {
  const employeeGroups = useMemo(() => groupByEmployee(unit.shifts), [unit.shifts])
  const unitDates = useMemo(() => uniqueDatesFromSchedules([unit]), [unit])

  return (
    <details className={styles.orgDetails} open>
      <summary className={styles.orgSummary}>
        <div>
          <span>{unit.organizationalUnit}</span>
        </div>
        <span className={styles.summaryMeta}>{employeeGroups.size} employees</span>
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
      <div className={styles.orgContent}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${styles.thSticky}`}>Employee</th>
                {unitDates.map((date) => (
                  <th key={date} className={styles.th}>
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(employeeGroups.entries()).map(([employeeName, shifts], index) => {
                const byDate = groupByDate(shifts)
                return (
                  <tr
                    key={`${unit.organizationalUnit}-${employeeName}`}
                    className={`${styles.row} ${index > 0 ? styles.lightSeparator : ''}`.trim()}
                  >
                    <td className={styles.tdSticky}>{employeeName}</td>
                    {unitDates.map((date) => {
                      const dateShifts = byDate.get(date) ?? []
                      return (
                        <td
                          key={`${unit.organizationalUnit}-${employeeName}-${date}`}
                          className={styles.td}
                        >
                          <div className={styles.cellStack}>
                            {dateShifts.length === 0 ? (
                              <span className={styles.emptyCell}>-</span>
                            ) : (
                              dateShifts.map((shift) => (
                                <div key={shift.shiftId} className={styles.shiftChip}>
                                  <div className={styles.shiftChipHeader}>
                                    <p className={styles.shiftChipTitle}>{shift.activity}</p>
                                    <p className={styles.shiftChipText}>
                                      {toClockTime(shift.startTime)} - {toClockTime(shift.endTime)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  )
})

type OrganizationScheduleTabProps = {
  units: OrganizationalUnitSchedule[]
}

const OrganizationScheduleTab = memo(function OrganizationScheduleTab({
  units,
}: Readonly<OrganizationScheduleTabProps>) {
  if (units.length === 0) {
    return (
      <section className={`${styles.card} ${styles.cardPad}`}>
        <p className={styles.orgEmpty}>
          No organizational unit schedules available for the selected week.
        </p>
      </section>
    )
  }

  return (
    <div className={styles.orgList}>
      {units.map((unit) => (
        <OrganizationUnitTable key={unit.organizationalUnit} unit={unit} />
      ))}
    </div>
  )
})

// ===== Main Component =====

export const SchedulingPage = memo(function SchedulingPage({
  weeks,
  selectedWeekKey,
  onSelectWeek,
}: Readonly<SchedulingPageProps>) {
  const [activeTab, setActiveTab] = useState<SchedulingTab>('worker')

  const selected = useMemo(
    () => weeks.find((week) => weekKey(week.week) === selectedWeekKey) ?? weeks[0],
    [weeks, selectedWeekKey],
  )

  const workerShifts = useMemo(
    () =>
      [...(selected?.workerSchedule.shifts ?? [])].sort(
        (a, b) => DateTime.fromISO(a.startTime).toMillis() - DateTime.fromISO(b.startTime).toMillis(),
      ),
    [selected],
  )

  const organizationalUnitSchedules = useMemo(
    () => selected?.organizationalUnitSchedules ?? [],
    [selected],
  )

  const handleTabChange = useCallback((tab: SchedulingTab) => {
    setActiveTab(tab)
  }, [])

  const isEmpty =
    !selected || (activeTab === 'worker' && workerShifts.length === 0)

  return (
    <section className={styles.section}>
      <WeekSelector weeks={weeks} selectedWeekKey={selectedWeekKey} onChange={onSelectWeek} />
      <TabControls activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'worker' ? (
        <WorkerScheduleTab shifts={workerShifts} />
      ) : (
        <OrganizationScheduleTab units={organizationalUnitSchedules} />
      )}

      {isEmpty ? <p className={styles.message}>No schedule data available for the selected week.</p> : null}
    </section>
  )
})

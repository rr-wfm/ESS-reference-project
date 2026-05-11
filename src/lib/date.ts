import type { IsoWeek, Shift } from '../types'
import { DateTime } from 'luxon'

export function getIsoWeek(date: Date): IsoWeek {
  const current = DateTime.fromJSDate(date)

  return {
    year: current.weekYear,
    week: current.weekNumber,
  }
}

export function weekKey(week: IsoWeek): string {
  return `${week.year}-${String(week.week).padStart(2, '0')}`
}

export function formatDateTime(input: string): string {
  const parsed = DateTime.fromISO(input)
  if (!parsed.isValid) {
    return input
  }
  return parsed.toLocaleString(DateTime.DATETIME_MED)
}

export function findNextShift(shifts: Shift[]): Shift | undefined {
  const now = DateTime.now().toMillis()
  return shifts
    .filter((shift) => DateTime.fromISO(shift.startTime).toMillis() >= now)
    .sort(
      (a, b) => DateTime.fromISO(a.startTime).toMillis() - DateTime.fromISO(b.startTime).toMillis(),
    )[0]
}

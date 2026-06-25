import { getIsoWeek, weekKey } from '../lib/date'
import type { ScheduleDataContract, WorkerModuleAuthorizationResponse } from '../types'

export function queryErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function getModuleNames(modules: WorkerModuleAuthorizationResponse[] = []): string[] {
  return Array.from(new Set(modules.flatMap((item) => item.modules)))
}

export function includesScheduleModule(moduleNames: string[]): boolean {
  return moduleNames.some((name) => name.toLowerCase() === 'schedule')
}

export function includesWorkedHoursModule(moduleNames: string[]): boolean {
  return moduleNames.some((name) => name.toLowerCase() === 'worked-hours')
}

export function resolveSelectedWeekKey(
  schedule: ScheduleDataContract | null,
  currentSelection: string,
): string {
  if (!schedule?.weeks.length) {
    return ''
  }

  const currentIsoWeekKey = weekKey(getIsoWeek(new Date()))
  const hasCurrentWeek = schedule.weeks.some((item) => weekKey(item.week) === currentIsoWeekKey)
  const fallbackWeekKey = hasCurrentWeek
    ? currentIsoWeekKey
    : weekKey(schedule.weeks[0].week)

  if (currentSelection && schedule.weeks.some((item) => weekKey(item.week) === currentSelection)) {
    return currentSelection
  }

  return fallbackWeekKey
}

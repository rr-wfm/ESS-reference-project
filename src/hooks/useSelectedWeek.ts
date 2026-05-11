import { useEffect, useState } from 'react'
import type { ScheduleDataContract } from '../types'
import { resolveSelectedWeekKey } from '../services/appDataService'

export function useSelectedWeek(schedule: ScheduleDataContract | null) {
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('')

  useEffect(() => {
    setSelectedWeekKey((current) => {
      return resolveSelectedWeekKey(schedule, current)
    })
  }, [schedule])

  return [selectedWeekKey, setSelectedWeekKey] as const
}

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import appStyles from '../App.module.css'
import { Layout } from './Layout'
import { HomePage } from '../pages/HomePage'
import { SchedulingPage } from '../pages/SchedulingPage'
import { WebhooksPage } from '../pages/WebhooksPage'
import { WorkedHoursPage } from '../pages/WorkedHoursPage'
import { findNextShift } from '../lib/date'
import {
  getModuleNames,
  includesScheduleModule,
  includesWorkedHoursModule,
  queryErrorMessage,
} from '../services/appDataService'
import { fetchModules, fetchSchedule, fetchWorkedHours, fetchByUri } from '../services/essApi'
import { useSelectedWeek, useWebhookProcessing } from '../hooks'
import type {
  AppSession,
  ScheduleDataContract,
  StoredWebhookEvent,
  WorkedHoursDataContract,
  WorkerModuleAuthorizationResponse,
} from '../types'

type AuthenticatedAppProps = {
  session: AppSession
  webhookEvents: StoredWebhookEvent[]
  webhookSubscriptionFailed: boolean
  onLogout: () => void
}

function AuthenticatedFallback({ message }: Readonly<{ message: string }>) {
  return <p className={appStyles.fallback}>{message}</p>
}

export function AuthenticatedApp({
  session,
  webhookEvents,
  webhookSubscriptionFailed,
  onLogout,
}: Readonly<AuthenticatedAppProps>) {
  const modulesQuery = useQuery<WorkerModuleAuthorizationResponse[]>({
    queryKey: ['modules', session.workerId],
    queryFn: async () => fetchModules(session.workerId),
  })

  const moduleNames = useMemo(() => getModuleNames(modulesQuery.data), [modulesQuery.data])

  const hasScheduleModule = useMemo(
    () => includesScheduleModule(moduleNames),
    [moduleNames],
  )

  const hasWorkedHoursModule = useMemo(
    () => includesWorkedHoursModule(moduleNames),
    [moduleNames],
  )

  const scheduleQuery = useQuery<ScheduleDataContract | null>({
    queryKey: ['schedule', session.workerId],
    enabled: hasScheduleModule,
    queryFn: async () => fetchSchedule(session.workerId),
  })

  const workedHoursQuery = useQuery<WorkedHoursDataContract | null>({
    queryKey: ['worked-hours', session.workerId],
    enabled: hasWorkedHoursModule,
    queryFn: async () => fetchWorkedHours(session.workerId),
  })

  const [selectedWeekKey, setSelectedWeekKey] = useSelectedWeek(scheduleQuery.data ?? null)

  // Process webhook events
  useWebhookProcessing({
    events: webhookEvents,
    workerId: session.workerId,
    fetchByUri,
  })

  const schedule = scheduleQuery.data ?? null
  const homeLoading = modulesQuery.isPending || (hasScheduleModule && scheduleQuery.isPending)
  let homeError: string | undefined
  if (modulesQuery.error) {
    homeError = queryErrorMessage(modulesQuery.error, 'Unable to load worker modules.')
  } else if (scheduleQuery.error) {
    homeError = queryErrorMessage(scheduleQuery.error, 'Unable to load worker schedule.')
  }

  const allShifts = useMemo(
    () => schedule?.weeks.flatMap((week) => week.workerSchedule.shifts) ?? [],
    [schedule],
  )

  const nextShift = useMemo(() => findNextShift(allShifts), [allShifts])

  return (
    <Routes>
      <Route path="/" element={<Layout workerId={session.workerId} onLogout={onLogout} webhookSubscriptionFailed={webhookSubscriptionFailed} schedulingEnabled={hasScheduleModule} workedHoursEnabled={hasWorkedHoursModule} />}>
        <Route
          index
          element={
            <HomePage
              userName={session.userName ?? session.workerId}
              loading={homeLoading}
              moduleNames={moduleNames}
              nextShift={nextShift}
              error={homeError}
            />
          }
        />
        <Route
          path="scheduling"
          element={
            schedule ? (
              <SchedulingPage
                weeks={schedule.weeks}
                selectedWeekKey={selectedWeekKey}
                onSelectWeek={setSelectedWeekKey}
              />
            ) : (
              <AuthenticatedFallback message="Schedule data is not available." />
            )
          }
        />
        <Route
          path="worked-hours"
          element={
            workedHoursQuery.data ? (
              <WorkedHoursPage weeks={workedHoursQuery.data.weeks ?? []} />
            ) : (
              <AuthenticatedFallback message="Worked hours data is not available." />
            )
          }
        />
        <Route path="webhooks" element={<WebhooksPage events={webhookEvents} />} />
      </Route>
    </Routes>
  )
}

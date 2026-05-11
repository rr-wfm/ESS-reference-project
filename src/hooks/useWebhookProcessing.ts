import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { StoredWebhookEvent } from '../types'

type UseWebhookProcessingProps = {
  events: StoredWebhookEvent[]
  workerId: string
  fetchByUri: (uri: string) => Promise<unknown>
}

export function useWebhookProcessing({
  events,
  workerId,
  fetchByUri,
}: UseWebhookProcessingProps) {
  const lastProcessedEventId = useRef(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (events.length === 0) {
      return
    }

    let stopped = false

    const runWebhookProcessing = async (): Promise<void> => {
      try {
        const newEvents = events.filter((item) => item.id > lastProcessedEventId.current)
        if (newEvents.length === 0) {
          return
        }

        let invalidateSchedule = false
        let invalidateModules = false

        for (const item of newEvents) {
          if (item.scope.workerId === workerId) {
            await fetchByUri(item.scope.uri)

            const eventType = item.event.type.toLowerCase()
            if (eventType.includes('schedule')) {
              invalidateSchedule = true
            } else if (eventType.includes('module')) {
              invalidateModules = true
            } else {
              invalidateSchedule = true
              invalidateModules = true
            }
          }

          lastProcessedEventId.current = Math.max(lastProcessedEventId.current, item.id)
        }

        const invalidations: Promise<unknown>[] = []

        if (invalidateSchedule) {
          invalidations.push(queryClient.invalidateQueries({ queryKey: ['schedule', workerId] }))
        }

        if (invalidateModules) {
          invalidations.push(queryClient.invalidateQueries({ queryKey: ['modules', workerId] }))
        }

        if (invalidations.length > 0) {
          await Promise.all(invalidations)
        }

        if (stopped) {
          return
        }
      } catch (err) {
        // Polling should not block main app behavior, but log so failures
        // are visible during development.
        console.warn('[useWebhookProcessing] Failed to process webhook events', err)
      }
    }

    void runWebhookProcessing()

    return () => {
      stopped = true
    }
  }, [events, workerId, queryClient, fetchByUri])
}

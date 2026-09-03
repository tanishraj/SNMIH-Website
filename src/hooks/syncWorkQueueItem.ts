export const workQueueSyncContextKey = 'workQueueSync'

export const isWorkQueueSyncContext = (context: Record<string, unknown> | null | undefined) => {
  return context?.[workQueueSyncContextKey] === true
}

export const withWorkQueueSyncContext = (
  context: Record<string, unknown> | null | undefined,
) => {
  return {
    ...(context ?? {}),
    [workQueueSyncContextKey]: true,
  }
}

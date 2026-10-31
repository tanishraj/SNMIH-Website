'use client'

import { useRowLabel } from '@payloadcms/ui'

export function CareersGroupRowLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string | null }>()
  return <span>{data?.name?.trim() || `Group ${(rowNumber ?? 0) + 1}`}</span>
}

export function CareersOpeningRowLabel() {
  const { data, rowNumber } = useRowLabel<{ status?: string | null; title?: string | null }>()
  const title = data?.title?.trim() || `Opening ${(rowNumber ?? 0) + 1}`
  return (
    <span>
      {title}
      {data?.status === 'closed' ? ' · Closed' : ''}
    </span>
  )
}

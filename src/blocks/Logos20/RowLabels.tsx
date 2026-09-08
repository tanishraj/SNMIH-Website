'use client'

import { useRowLabel } from '@payloadcms/ui'

export function LogoRowLabel() {
  const { data, rowNumber } = useRowLabel<{ logos?: unknown[] | null }>()
  const count = data?.logos?.length ?? 0
  return (
    <span>
      Row {(rowNumber ?? 0) + 1} · {count} {count === 1 ? 'logo' : 'logos'}
    </span>
  )
}

export function LogoItemLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string | null }>()
  return <span>{data?.name?.trim() || `Logo ${(rowNumber ?? 0) + 1}`}</span>
}

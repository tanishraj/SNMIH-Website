'use client'

import { useRowLabel } from '@payloadcms/ui'

type BankAccountRow = {
  purpose?: string | null
}

export const BankAccountRowLabel = () => {
  const { data, rowNumber } = useRowLabel<BankAccountRow>()
  const purpose = data?.purpose?.trim()

  return <span>{purpose || `Bank account ${(rowNumber ?? 0) + 1}`}</span>
}

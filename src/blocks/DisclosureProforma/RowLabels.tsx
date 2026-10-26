'use client'

import { useRowLabel } from '@payloadcms/ui'

import { sectionOptions } from './shared'

type SectionRow = {
  enabled?: boolean | null
  key?: string | null
  label?: string | null
}

export const DisclosureSectionRowLabel = () => {
  const { data, rowNumber } = useRowLabel<SectionRow>()
  const name =
    data?.label?.trim() ||
    sectionOptions.find((option) => option.value === data?.key)?.label ||
    `Section ${(rowNumber ?? 0) + 1}`

  return (
    <span>
      {name}
      {data?.enabled === false && <span style={{ opacity: 0.6 }}> (hidden)</span>}
    </span>
  )
}

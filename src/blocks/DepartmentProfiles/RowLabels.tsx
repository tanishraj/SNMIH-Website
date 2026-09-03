'use client'

import { useRowLabel } from '@payloadcms/ui'

type NamedRow = {
  name?: string | null
}

const resolveLabel = (name: string | null | undefined, fallback: string, rowNumber?: number) =>
  name?.trim() || `${fallback} ${typeof rowNumber === 'number' ? rowNumber + 1 : ''}`.trim()

export const DepartmentRowLabel = () => {
  const { data, rowNumber } = useRowLabel<NamedRow>()

  return <span>{resolveLabel(data?.name, 'Department', rowNumber)}</span>
}

export const DepartmentProfileRowLabel = () => {
  const { data, rowNumber } = useRowLabel<NamedRow>()

  return <span>{resolveLabel(data?.name, 'Profile', rowNumber)}</span>
}

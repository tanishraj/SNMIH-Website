'use client'

import { useEffect, useMemo, useRef } from 'react'

import { NumberField, useField, useFormFields } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'

const logoHeightBySize = {
  compact: 56,
  default: 64,
  large: 80,
} as const

const getSiblingFieldPath = (path: string, siblingName: string) => {
  const parts = path.split('.')
  parts[parts.length - 1] = siblingName
  return parts.join('.')
}

export const LogoHeightField: NumberFieldClientComponent = (props) => {
  const { path } = props
  const { setValue, value } = useField<number | null>({ path })
  const sizePath = useMemo(() => getSiblingFieldPath(path, 'size'), [path])
  const sizeField = useFormFields(([fields]) => fields?.[sizePath])
  const sizeValue = sizeField && typeof sizeField === 'object' ? sizeField.value : undefined
  const prevSizeRef = useRef<string | null>(typeof sizeValue === 'string' ? sizeValue : null)

  useEffect(() => {
    if (typeof sizeValue !== 'string' || !(sizeValue in logoHeightBySize)) {
      return
    }

    const nextHeight = logoHeightBySize[sizeValue as keyof typeof logoHeightBySize]

    if (prevSizeRef.current === null) {
      prevSizeRef.current = sizeValue

      if (value == null) {
        setValue(nextHeight)
      }

      return
    }

    if (prevSizeRef.current !== sizeValue) {
      prevSizeRef.current = sizeValue
      setValue(nextHeight)
    }
  }, [setValue, sizeValue, value])

  return <NumberField {...props} />
}

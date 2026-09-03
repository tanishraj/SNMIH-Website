import { describe, expect, it } from 'vitest'

import { PageSettings } from '@/globals/PageSettings'

type ConditionalField = {
  admin?: {
    condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean
  }
  name?: string
}

const findField = (value: unknown, fieldName: string): ConditionalField | undefined => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const field = findField(item, fieldName)
      if (field) return field
    }
    return undefined
  }

  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const field = value as ConditionalField & {
    fields?: unknown
    tabs?: Array<{ fields?: unknown }>
  }

  if (field.name === fieldName) {
    return field
  }

  return findField(field.fields, fieldName) ?? findField(field.tabs, fieldName)
}

describe('announcement admin conditions', () => {
  it('shows announcement items from the live sibling checkbox value', () => {
    const itemsField = findField(PageSettings.fields, 'announcementItems')
    const condition = itemsField?.admin?.condition

    expect(condition).toBeTypeOf('function')
    expect(condition?.({}, { announcementEnabled: true })).toBe(true)
    expect(condition?.({}, { announcementEnabled: false })).toBe(false)
  })

  it('retains document-level data as a fallback condition source', () => {
    const itemsField = findField(PageSettings.fields, 'announcementItems')
    const condition = itemsField?.admin?.condition

    expect(condition?.({ announcementEnabled: true }, {})).toBe(true)
  })
})

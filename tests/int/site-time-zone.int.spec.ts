import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import {
  expandInclusiveDateKeys,
  formatZonedTime,
  getZonedDateKey,
  getZonedMonthBounds,
  getZonedMonthKey,
  getZonedYearBounds,
  normalizeSiteTimeZone,
} from '@/lib/siteTimeZone'

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if ('fields' in field) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }
  }
}

describe('site timezone contract', () => {
  it('normalizes configured zones and defaults to Indian Standard Time', () => {
    expect(normalizeSiteTimeZone(undefined)).toBe('Asia/Kolkata')
    expect(normalizeSiteTimeZone('Europe/London')).toBe('Europe/London')
    expect(normalizeSiteTimeZone('Mars/Olympus')).toBe('Asia/Kolkata')
  })

  it('groups timestamps and month boundaries in the configured zone', () => {
    expect(getZonedDateKey('2026-08-01T19:00:00.000Z', 'Asia/Kolkata')).toBe('2026-08-02')
    expect(getZonedMonthKey('2026-07-31T19:00:00.000Z', 'Asia/Kolkata')).toBe('2026-08')
    expect(getZonedMonthBounds('2026-08', 'Asia/Kolkata')).toEqual({
      endISO: '2026-08-31T18:29:59.999Z',
      startISO: '2026-07-31T18:30:00.000Z',
    })
  })

  it('derives inclusive year boundaries in the configured zone', () => {
    expect(getZonedYearBounds(2026, 'Asia/Kolkata')).toEqual({
      endISO: '2026-12-31T18:29:59.999Z',
      startISO: '2025-12-31T18:30:00.000Z',
    })
    expect(getZonedYearBounds(2026, 'Asia/Dubai')).toEqual({
      endISO: '2026-12-31T19:59:59.999Z',
      startISO: '2025-12-31T20:00:00.000Z',
    })
  })

  it('formats a simple local time without exposing the technical timezone suffix', () => {
    const label = formatZonedTime('2026-08-19T20:00:00.000Z', 'Asia/Kolkata')

    expect(label).toBe('1:30 AM')
    expect(label).not.toMatch(/GMT|UTC/)
  })

  it('expands inclusive local date keys without browser timezone arithmetic', () => {
    expect(expandInclusiveDateKeys('2026-08-30', '2026-09-02')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ])
  })

  it('owns the timezone in Site Identity and exposes focused cache tags', () => {
    expect(findNamedField(SiteSettings.fields, 'timeZone')).toMatchObject({
      defaultValue: 'Asia/Kolkata',
      required: true,
      type: 'select',
    })
    expect(CMS_CACHE_TAGS).toMatchObject({
      calendar: 'cms-calendar',
      siteSettings: 'cms-site-settings',
    })
  })
})

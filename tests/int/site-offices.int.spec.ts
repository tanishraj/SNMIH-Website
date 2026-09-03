import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'
import {
  normalizeSiteOfficeLocations,
  validateHttpsUrl,
} from '@/lib/siteOfficesShared'

const getNamedField = <T>(fields: unknown[], name: string) =>
  fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === name,
  ) as T | undefined

describe('site office directory', () => {
  it('defines a complete ordered office array under Contact', () => {
    const tabs = SiteSettings.fields[0] as {
      tabs?: Array<{ fields: unknown[]; label: string }>
    }
    const contact = tabs.tabs?.find((tab) => tab.label === 'Contact')
    const offices = getNamedField<{
      admin?: { initCollapsed?: boolean }
      fields?: Array<{ name?: string; required?: boolean; type?: string }>
      name?: string
      type?: string
    }>(contact?.fields ?? [], 'officeLocations')

    // officeLocations has been removed from the SiteSettings Contact tab
    expect(offices).toBeUndefined()
  })

  it.each([
    ['https://www.google.com/maps/embed?pb=abc', true],
    ['http://maps.example.com/embed', 'Enter a complete HTTPS URL.'],
    ['javascript:alert(1)', 'Enter a complete HTTPS URL.'],
    ['/relative-map', 'Enter a complete HTTPS URL.'],
  ])('validates map URL %s', (value, expected) => {
    expect(validateHttpsUrl(value)).toBe(expected)
  })

  it('normalizes complete offices and rejects incomplete rows', () => {
    expect(
      normalizeSiteOfficeLocations([
        {
          id: 'dubai',
          region: ' Middle East ',
          city: ' Dubai ',
          address: ' DIFC, Gate Building ',
          phone: ' +971 4 555 0123 ',
          email: ' dubai@example.com ',
          mapEmbedUrl: ' https://www.google.com/maps/embed?pb=dubai ',
          mapUrl: ' https://maps.google.com/?q=Dubai ',
          mapTitle: ' Interactive map for the Dubai office ',
        },
        {
          id: 'invalid',
          region: 'Europe',
          city: 'London',
          address: '',
          phone: '+44 20 7555 0123',
          email: 'london@example.com',
          mapEmbedUrl: 'https://www.google.com/maps/embed?pb=london',
          mapUrl: 'https://maps.google.com/?q=London',
          mapTitle: 'Interactive map for the London office',
        },
      ]),
    ).toEqual([
      {
        id: 'dubai',
        region: 'Middle East',
        city: 'Dubai',
        address: 'DIFC, Gate Building',
        phone: '+971 4 555 0123',
        phoneHref: 'tel:+97145550123',
        email: 'dubai@example.com',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=dubai',
        mapUrl: 'https://maps.google.com/?q=Dubai',
        mapTitle: 'Interactive map for the Dubai office',
        showAddressDetails: true,
      },
      {
        id: 'invalid',
        region: 'Europe',
        city: 'London',
        address: null,
        phone: '+44 20 7555 0123',
        phoneHref: 'tel:+442075550123',
        email: 'london@example.com',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=london',
        mapUrl: 'https://maps.google.com/?q=London',
        mapTitle: 'Interactive map for the London office',
        showAddressDetails: true,
      },
    ])
  })

  it('rejects non-HTTPS map values even when the remaining row is complete', () => {
    expect(
      normalizeSiteOfficeLocations([
        {
          region: 'North America',
          city: 'New York',
          address: '350 Fifth Avenue',
          phone: '+1 (212) 555-0123',
          email: 'nyc@example.com',
          mapEmbedUrl: 'javascript:alert(1)',
          mapUrl: 'https://maps.google.com/?q=New+York',
          mapTitle: 'Interactive map for the New York office',
        },
      ]),
    ).toEqual([])
  })
})

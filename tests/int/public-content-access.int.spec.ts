import type { CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Articles } from '@/collections/Articles'
import { Footers } from '@/collections/Footers'
import { Forms } from '@/collections/Forms'
import { GalleryAlbums } from '@/collections/GalleryAlbums'
import { Headers } from '@/collections/Headers'
import { Media } from '@/collections/Media'
import { NavigationLinks } from '@/collections/NavigationLinks'
import { OfficeLocations } from '@/collections/OfficeLocations'
import { Pages } from '@/collections/Pages'
import { Redirects } from '@/collections/Redirects'
import { ReusableSections } from '@/collections/ReusableSections'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'

const anonymousArgs = { req: { user: null } } as never

const readAccess = (collection: CollectionConfig) => {
  const access = collection.access?.read

  if (!access) {
    throw new Error(`Expected ${collection.slug} to define read access.`)
  }

  return access(anonymousArgs)
}

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
  }

  return undefined
}

const expectAnonymousFieldReadDenied = (collection: CollectionConfig, fieldName: string) => {
  const field = findNamedField(collection.fields, fieldName)

  if (!field || !('access' in field) || !field.access?.read) {
    throw new Error(`Expected ${collection.slug}.${fieldName} to define field read access.`)
  }

  expect(field.access.read(anonymousArgs)).toBe(false)
}

describe('public content access', () => {
  it('uses Payload publication as the public boundary for governed content', () => {
    const expected = { _status: { equals: 'published' } }

    for (const collection of [Pages, Articles, SystemPages]) {
      expect(readAccess(collection), collection.slug).toEqual(expected)
    }

    expect(readAccess(Reviews)).toEqual({
      and: [
        { _status: { equals: 'published' } },
        {
          or: [
            { sourceSubmission: { exists: false } },
            { sourceSubmission: { equals: null } },
            { moderationStatus: { equals: 'approved' } },
          ],
        },
      ],
    })
  })

  it('requires Payload publication for draft-only public records', () => {
    const expected = { _status: { equals: 'published' } }

    for (const collection of [
      ReusableSections,
      Headers,
      Footers,
      OfficeLocations,
      NavigationLinks,
      Redirects,
      Forms,
      Media,
      GalleryAlbums,
    ]) {
      expect(readAccess(collection), collection.slug).toEqual(expected)
    }
  })

  it('hides internal Form fields from anonymous API responses', () => {
    for (const fieldName of ['internalNotes', 'notificationRecipients']) {
      expectAnonymousFieldReadDenied(Forms, fieldName)
    }
  })

  it('hides internal Media fields from anonymous API responses', () => {
    for (const fieldName of [
      'storageStatus',
      'storageCheckedAt',
      'storageMissingSince',
      'storageIssue',
      'title',
      'assetType',
      'tags',
      'notes',
      'isCriticalAsset',
      'replacementNotes',
      'usageSummary',
      'usageDetails',
    ]) {
      expectAnonymousFieldReadDenied(Media, fieldName)
    }
  })
})

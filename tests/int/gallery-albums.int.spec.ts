import { describe, expect, it } from 'vitest'

import { GalleryAlbums } from '@/collections/GalleryAlbums'
import config from '@/payload.config'

describe('gallery albums collection', () => {
  it('defines ordered published albums managed through the Gallery Albums feature', async () => {
    const resolvedConfig = await config
    const tabs = GalleryAlbums.fields[0] as {
      tabs: Array<{ fields: Array<Record<string, unknown>>; label: string }>
      type: string
    }
    const content = tabs.tabs.find((tab) => tab.label === 'Content')
    const images = content?.fields.find((field) => field.name === 'images') as {
      fields?: Array<Record<string, unknown>>
      minRows?: number
      required?: boolean
      type?: string
    }

    expect(GalleryAlbums.slug).toBe('gallery-albums')
    expect(
      typeof GalleryAlbums.versions === 'object' &&
        GalleryAlbums.versions !== null &&
        'drafts' in GalleryAlbums.versions,
    ).toBe(true)
    expect(GalleryAlbums.admin).toMatchObject({
      group: 'Media',
      useAsTitle: 'title',
    })
    expect(images).toMatchObject({ minRows: 1, required: true, type: 'array' })
    expect(images.fields?.map((field) => field.name).filter((name) => name !== 'id')).toEqual([
      'image',
      'caption',
    ])
    expect(images.fields?.[0]).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(
      resolvedConfig.collections?.some((collection) => collection.slug === 'gallery-albums'),
    ).toBe(true)
  })
})

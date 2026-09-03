import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import {
  normalizeEventGalleryAlbums,
  type EventGalleryAlbum,
} from '@/lib/eventGalleryShared'

const loadEventGalleryAlbums = cache(
  async (draft: boolean, ...selectedAlbumIDs: string[]): Promise<EventGalleryAlbum[]> => {
    if (!selectedAlbumIDs.length) {
      return []
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'gallery-albums',
      depth: 1,
      draft,
      pagination: false,
      sort: '-createdAt',
      where: draft
        ? {
            id: {
              in: selectedAlbumIDs,
            },
          }
        : {
            and: [
              {
                id: {
                  in: selectedAlbumIDs,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },
    })

    return normalizeEventGalleryAlbums(result.docs)
  },
)

export const getPublishedEventGalleryAlbums = (selectedAlbumIDs: string[]) =>
  loadEventGalleryAlbums(false, ...selectedAlbumIDs)

export const getDraftEventGalleryAlbums = (selectedAlbumIDs: string[]) =>
  loadEventGalleryAlbums(true, ...selectedAlbumIDs)

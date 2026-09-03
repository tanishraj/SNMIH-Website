import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))

import { getDraftEventGalleryAlbums, getPublishedEventGalleryAlbums } from '@/lib/eventGallery'
import {
  getEventGalleryAlbumRelationshipIDs,
  getGalleryAlbumIDsFromBlocks,
  normalizeEventGalleryAlbums,
  selectAndOrderEventGalleryAlbums,
  type EventGalleryAlbum,
} from '@/lib/eventGalleryShared'

beforeEach(() => {
  mocks.find.mockReset()
  mocks.getPayload.mockReset()
  mocks.find.mockResolvedValue({ docs: [] })
  mocks.getPayload.mockResolvedValue({ find: mocks.find })
})

describe('event gallery data path', () => {
  it('extracts unique IDs from raw and populated relationships', () => {
    expect(
      getEventGalleryAlbumRelationshipIDs([
        'album-2',
        { id: 'album-1', title: 'Yoga Day' },
        null,
        { title: 'Missing ID' },
        'album-2',
      ]),
    ).toEqual(['album-2', 'album-1'])
  })

  it('collects the selected album union across gallery-backed blocks and reusable sections', () => {
    const cyclicSection: { blockType: string; section?: unknown } = {
      blockType: 'reusableSection',
    }
    cyclicSection.section = { layout: [cyclicSection] }

    expect(
      getGalleryAlbumIDsFromBlocks([
        {
          blockType: 'eventGallery',
          galleryAlbums: ['album-2', { id: 'album-1' }],
        },
        {
          blockType: 'imageMosaic',
          contentSource: 'galleryAlbums',
          galleryAlbums: ['album-3', 'album-2'],
        },
        {
          blockType: 'galleryAlbumTabs',
          galleryAlbums: ['album-5', 'album-3'],
        },
        {
          blockType: 'imageMosaic',
          contentSource: 'manualImages',
          galleryAlbums: ['ignored-manual'],
        },
        {
          blockType: 'reusableSection',
          section: {
            layout: [
              {
                blockType: 'imageMosaic',
                contentSource: 'galleryAlbums',
                galleryAlbums: [{ id: 'album-4' }],
              },
              {
                blockType: 'galleryAlbumTabs',
                galleryAlbums: [{ id: 'album-6' }],
              },
            ],
          },
        },
        { blockType: 'cta39', galleryAlbums: ['ignored-other-block'] },
        cyclicSection,
        null,
      ]),
    ).toEqual(['album-2', 'album-1', 'album-3', 'album-5', 'album-4', 'album-6'])
  })

  it('preserves relationship order in manual mode', () => {
    const albums = [
      {
        id: 'album-1',
        title: 'New Batch Day',
        createdAt: '2026-07-25T00:00:00.000Z',
        eventDate: '2026-07-25T00:00:00.000Z',
      },
      {
        id: 'album-2',
        title: 'Yoga Day',
        createdAt: '2026-07-26T00:00:00.000Z',
        eventDate: '2026-06-21T00:00:00.000Z',
      },
    ] as EventGalleryAlbum[]

    expect(
      selectAndOrderEventGalleryAlbums({
        albums,
        displayOrder: 'manual',
        selectedAlbumIDs: ['album-2', 'album-1'],
      }).map((album) => album.id),
    ).toEqual(['album-2', 'album-1'])
  })

  it('sorts by Event Date with deterministic missing-date and tie behavior', () => {
    const albums = [
      {
        id: 'missing-new',
        title: 'Missing New',
        createdAt: '2026-07-27T00:00:00.000Z',
      },
      {
        id: 'same-older',
        title: 'Same Older',
        createdAt: '2026-07-20T00:00:00.000Z',
        eventDate: '2026-08-15T00:00:00.000Z',
      },
      {
        id: 'latest',
        title: 'Latest',
        createdAt: '2026-07-18T00:00:00.000Z',
        eventDate: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'same-newer',
        title: 'Same Newer',
        createdAt: '2026-07-25T00:00:00.000Z',
        eventDate: '2026-08-15T00:00:00.000Z',
      },
      {
        id: 'missing-old',
        title: 'Missing Old',
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ] as EventGalleryAlbum[]

    expect(
      selectAndOrderEventGalleryAlbums({
        albums,
        displayOrder: 'latestEventDate',
        selectedAlbumIDs: ['missing-old', 'same-older', 'latest', 'same-newer', 'missing-new'],
      }).map((album) => album.id),
    ).toEqual(['latest', 'same-newer', 'same-older', 'missing-new', 'missing-old'])
  })

  it('normalizes valid images, uses the first as cover, and sorts newest first', () => {
    const albums = normalizeEventGalleryAlbums([
      {
        id: 1,
        title: 'Yoga Day',
        createdAt: '2026-06-21T00:00:00.000Z',
        images: [
          {
            id: 'row-1',
            image: {
              id: 10,
              alt: 'Yoga session',
              url: '/media/yoga.jpg',
              width: 1600,
              height: 900,
            },
            caption: 'Morning session',
          },
        ],
      },
      {
        id: 2,
        title: 'New Batch Day',
        createdAt: '2026-07-25T00:00:00.000Z',
        images: [
          {
            id: 'row-2',
            image: {
              id: 11,
              alt: 'New students',
              url: '/media/batch.jpg',
              width: 1600,
              height: 900,
            },
          },
          {
            id: 'broken',
            image: 999,
          },
        ],
      },
    ])

    expect(albums.map((album) => album.title)).toEqual(['New Batch Day', 'Yoga Day'])
    expect(albums[0]).toMatchObject({
      cover: { mediaID: '11', src: '/media/batch.jpg' },
      imageCount: 1,
    })
    expect(albums[1]?.images[0]).toMatchObject({
      caption: 'Morning session',
      id: 'row-1',
      mediaID: '10',
    })
  })

  it('filters albums without a title or resolvable image', () => {
    expect(
      normalizeEventGalleryAlbums([
        {
          id: 1,
          title: 'No images',
          createdAt: '2026-07-25T00:00:00.000Z',
          images: [{ image: 12 }],
        },
        {
          id: 2,
          title: ' ',
          createdAt: '2026-07-26T00:00:00.000Z',
          images: [
            {
              image: {
                id: 13,
                alt: 'Hidden',
                url: '/media/hidden.jpg',
                width: 1600,
                height: 900,
              },
            },
          ],
        },
      ]),
    ).toEqual([])
  })

  it('queries only selected published and draft albums without pagination', async () => {
    await getPublishedEventGalleryAlbums(['album-2', 'album-1'])
    await getDraftEventGalleryAlbums(['album-3'])

    expect(mocks.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'gallery-albums',
        depth: 1,
        draft: false,
        pagination: false,
        sort: '-createdAt',
        where: {
          and: [{ id: { in: ['album-2', 'album-1'] } }, { _status: { equals: 'published' } }],
        },
      }),
    )
    expect(mocks.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'gallery-albums',
        depth: 1,
        draft: true,
        pagination: false,
        sort: '-createdAt',
        where: { id: { in: ['album-3'] } },
      }),
    )
  })

  it('returns an empty result without querying Payload when nothing is selected', async () => {
    await expect(getPublishedEventGalleryAlbums([])).resolves.toEqual([])
    await expect(getDraftEventGalleryAlbums([])).resolves.toEqual([])

    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.find).not.toHaveBeenCalled()
  })
})

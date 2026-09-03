import type { FieldHook, PayloadRequest, RowField, TextField } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { Articles } from '@/collections/Articles'
import { Categories } from '@/collections/Categories'
import { Footers } from '@/collections/Footers'
import { Forms } from '@/collections/Forms'
import { GalleryAlbums } from '@/collections/GalleryAlbums'
import { Headers } from '@/collections/Headers'
import { NewsEvents } from '@/collections/NewsEvents'
import { NewsEventClassifications } from '@/collections/NewsEventClassifications'
import { Pages } from '@/collections/Pages'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'
import { Tags } from '@/collections/Tags'
import { normalizeProjectSlug, projectSlugField } from '@/fields/projectSlugField'

type SlugTextField = TextField & {
  custom?: {
    slugify?: (args: {
      data: Record<string, unknown>
      req: PayloadRequest
      valueToSlugify?: unknown
    }) => Promise<string | undefined> | string | undefined
  }
}

const getSlugTextField = (row: RowField): SlugTextField => {
  const field = row.fields.find(
    (candidate): candidate is SlugTextField =>
      'name' in candidate && candidate.name === 'slug' && candidate.type === 'text',
  )

  if (!field) throw new Error('Expected the project slug row to contain a slug text field.')

  return field
}

const getDuplicateHook = (): FieldHook => {
  const hook = getSlugTextField(projectSlugField({ useAsSlug: 'title' })).hooks
    ?.beforeDuplicate?.[0]

  if (!hook) throw new Error('Expected the project slug field to define a duplicate hook.')

  return hook
}

const findSlugTextFields = (fields: unknown[]): SlugTextField[] =>
  fields.flatMap((field) => {
    if (!field || typeof field !== 'object') return []

    const candidate = field as Record<string, unknown>
    const matches =
      candidate.name === 'slug' && candidate.type === 'text' ? [candidate as SlugTextField] : []
    const nestedFields = Array.isArray(candidate.fields) ? findSlugTextFields(candidate.fields) : []
    const tabFields = Array.isArray(candidate.tabs)
      ? candidate.tabs.flatMap((tab) => {
          if (!tab || typeof tab !== 'object') return []

          const fields = (tab as Record<string, unknown>).fields

          return Array.isArray(fields) ? findSlugTextFields(fields) : []
        })
      : []

    return [...matches, ...nestedFields, ...tabFields]
  })

const createHookArgs = ({ find, value }: { find: ReturnType<typeof vi.fn>; value: string }) => {
  const req = {
    payload: {
      find,
    },
  } as unknown as PayloadRequest

  return {
    args: {
      collection: { slug: 'gallery-albums' },
      req,
      value,
    } as Parameters<FieldHook>[0],
    req,
  }
}

describe('project slug field', () => {
  it('normalizes words and separator runs into a clean slug', () => {
    expect(normalizeProjectSlug('  Campus --- News  ')).toBe('campus-news')
    expect(normalizeProjectSlug('Campus - Copy')).toBe('campus-copy')
    expect(normalizeProjectSlug('Director’s Message')).toBe('directors-message')
    expect(normalizeProjectSlug('---')).toBeUndefined()
    expect(normalizeProjectSlug(null)).toBeUndefined()
  })

  it('uses a clean copy suffix when the first candidate is available', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const { args, req } = createHookArgs({ find, value: 'campus' })

    await expect(getDuplicateHook()(args)).resolves.toBe('campus-copy')
    expect(find).toHaveBeenCalledWith({
      collection: 'gallery-albums',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        slug: {
          equals: 'campus-copy',
        },
      },
    })
  })

  it('increments the copy suffix until it finds an available slug', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 'copy-1' }] })
      .mockResolvedValueOnce({ docs: [{ id: 'copy-2' }] })
      .mockResolvedValueOnce({ docs: [] })
    const { args } = createHookArgs({ find, value: 'campus' })

    await expect(getDuplicateHook()(args)).resolves.toBe('campus-copy-3')
    expect(find.mock.calls.map(([query]) => query.where.slug.equals)).toEqual([
      'campus-copy',
      'campus-copy-2',
      'campus-copy-3',
    ])
  })

  it('recovers the base from legacy malformed duplicate slugs', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [{ id: 'copy-1' }] })
      .mockResolvedValueOnce({ docs: [{ id: 'copy-2' }] })
      .mockResolvedValueOnce({ docs: [] })
    const { args } = createHookArgs({ find, value: 'campus---copy---copy' })

    await expect(getDuplicateHook()(args)).resolves.toBe('campus-copy-3')
  })

  it('lets title-based generation handle an unusable source slug', async () => {
    const find = vi.fn()
    const { args } = createHookArgs({ find, value: '---' })

    await expect(getDuplicateHook()(args)).resolves.toBeUndefined()
    expect(find).not.toHaveBeenCalled()
  })

  it('stops after the bounded number of occupied copy candidates', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 'occupied' }] })
    const { args } = createHookArgs({ find, value: 'campus' })

    await expect(getDuplicateHook()(args)).rejects.toMatchObject({
      message: 'Unable to create a unique duplicate slug after 1000 attempts.',
      status: 409,
    })
    expect(find).toHaveBeenCalledTimes(1_000)
  })

  it('installs the shared slug contract in every generated-slug collection', async () => {
    const collections = [
      Articles,
      Categories,
      Forms,
      Footers,
      GalleryAlbums,
      Headers,
      NewsEventClassifications,
      NewsEvents,
      Pages,
      Reviews,
      SystemPages,
      Tags,
    ]
    const req = {} as PayloadRequest

    for (const collection of collections) {
      const slugFields = findSlugTextFields(collection.fields)

      expect(slugFields, collection.slug).toHaveLength(1)

      const [slug] = slugFields

      expect(slug?.unique, collection.slug).toBe(true)
      expect(slug?.index, collection.slug).toBe(true)
      expect(slug?.hooks?.beforeDuplicate, collection.slug).toHaveLength(1)
      expect(
        await slug?.custom?.slugify?.({
          data: {},
          req,
          valueToSlugify: 'Campus --- News',
        }),
      ).toBe('campus-news')
    }
  })
})

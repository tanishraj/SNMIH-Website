import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { NewsEvents } from '@/collections/NewsEvents'
import { resolveNewsEventClassification } from '@/hooks/resolveNewsEventClassification'
import { normalizeNewsEventFields } from '@/hooks/normalizeNewsEventFields'
import type { NewsEventClassificationBehavior } from '@/lib/newsEventClassifications'
import { toPublicNewsEventCard } from '@/lib/newsEventsShared'
import config from '@/payload.config'

const getTabs = (fields: unknown[]) => {
  const tabs = fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'type' in field && field.type === 'tabs',
  ) as { tabs?: Array<{ fields: unknown[]; label: string }> } | undefined

  return tabs?.tabs ?? []
}

const findNamedField = (value: unknown, name: string): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.name === name) return record

    for (const child of Object.values(record)) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  return undefined
}

const findLabeledField = (value: unknown, label: string): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findLabeledField(child, label)
      if (match) return match
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.label === label) return record

    for (const child of Object.values(record)) {
      const match = findLabeledField(child, label)
      if (match) return match
    }
  }

  return undefined
}

describe('News & Events editorial model', () => {
  it('registers the typed collection without the retired archive settings global', async () => {
    const resolvedConfig = await config

    expect(resolvedConfig.collections?.map(({ slug }) => slug)).toContain('news-events')
    expect(resolvedConfig.globals?.map(({ slug }) => slug)).not.toContain('news-events-settings')
    expect(NewsEvents.versions).toBeTruthy()
    expect(
      typeof NewsEvents.versions === 'object' && NewsEvents.versions !== null
        ? 'drafts' in NewsEvents.versions
        : NewsEvents.versions === true,
    ).toBe(true)
  })

  it('organizes collection fields into clear tabs', () => {
    expect(getTabs(NewsEvents.fields).map(({ label }) => label)).toEqual([
      'Content',
      'Event Details',
      'SEO',
    ])
  })

  it('keeps writing, presentation, and topical metadata together in Content', () => {
    const content = getTabs(NewsEvents.fields).find(({ label }) => label === 'Content')

    for (const name of [
      'classification',
      'excerpt',
      'featuredImage',
      'featuredImagePosition',
      'body',
    ]) {
      expect(findNamedField(content?.fields ?? [], name)).toBeDefined()
    }

    const topics = findLabeledField(content?.fields ?? [], 'Topics & Tags')

    expect(topics).toMatchObject({
      admin: { initCollapsed: true },
      type: 'collapsible',
    })
    for (const name of ['primaryCategory', 'tags', 'categories']) {
      expect(findNamedField(topics?.fields ?? [], name)).toBeDefined()
    }
  })

  it('uses behavior-neutral default list columns', () => {
    expect(NewsEvents.admin?.defaultColumns).toEqual([
      'title',
      'classification',
      '_status',
      'updatedAt',
    ])
  })

  it('uses a required dynamic relationship and retains the hidden optional compatibility field', () => {
    expect(findNamedField(NewsEvents.fields, 'classification')).toMatchObject({
      admin: {
        allowCreate: true,
      },
      filterOptions: { active: { equals: true } },
      label: 'Entry Classification',
      relationTo: 'news-event-classifications',
      required: true,
      type: 'relationship',
    })
    expect(findNamedField(NewsEvents.fields, 'contentType')).toMatchObject({
      admin: { hidden: true },
      options: [
        { label: 'News', value: 'news' },
        { label: 'Events', value: 'event' },
        { label: 'Notice', value: 'notice' },
        { label: 'Holiday', value: 'holiday' },
        { label: 'Achievements', value: 'achievement' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'Others', value: 'other' },
      ],
      type: 'select',
    })
    expect(findNamedField(NewsEvents.fields, 'contentType')).not.toHaveProperty('defaultValue')
    expect(findNamedField(NewsEvents.fields, 'contentType')).not.toHaveProperty('required')
    expect(NewsEvents.admin?.defaultColumns).toContain('classification')
    expect(NewsEvents.admin?.defaultColumns).not.toContain('contentType')
  })

  it('keeps Event Details visible and delegates behavior validation to the collection hook', () => {
    const eventDetails = getTabs(NewsEvents.fields).find(({ label }) => label === 'Event Details')

    expect(eventDetails).not.toHaveProperty('admin.condition')

    for (const name of [
      'eventStart',
      'eventEnd',
      'eventAllDay',
      'featuredInHighlights',
      'eventLocation',
      'eventRegistrationAction',
    ]) {
      const field = findNamedField(eventDetails?.fields ?? [], name)

      expect(field).toBeDefined()
      expect(field?.admin).not.toHaveProperty('condition')
    }

    expect(findNamedField(eventDetails?.fields ?? [], 'featuredInHighlights')).toMatchObject({
      defaultValue: false,
      index: true,
      label: 'Featured in Highlights',
      type: 'checkbox',
    })
  })

  it('retains but hides the legacy per-entry Byline', () => {
    expect(findNamedField(NewsEvents.fields, 'authorName')?.admin).toMatchObject({ hidden: true })
    expect(NewsEvents.admin?.listSearchableFields).not.toContain('authorName')
  })

  it('clears event-only values for Story behavior', async () => {
    const result = await normalizeNewsEventFields({
      data: {
        eventAllDay: true,
        eventEnd: '2026-08-02T00:00:00.000Z',
        featuredInHighlights: true,
        eventLocation: 'Campus',
        eventRegistrationAction: [{ label: 'Register' }],
        eventStart: '2026-08-01T00:00:00.000Z',
      },
      req: {
        context: { newsEventClassificationBehavior: 'story' },
      },
    } as never)

    expect(result).toMatchObject({
      eventAllDay: null,
      eventEnd: null,
      featuredInHighlights: false,
      eventLocation: null,
      eventRegistrationAction: [],
      eventStart: null,
    })
  })

  it('retains event-only values for Event behavior', async () => {
    const data = {
      eventAllDay: true,
      eventEnd: '2026-08-02T00:00:00.000Z',
      featuredInHighlights: true,
      eventLocation: 'Campus',
      eventRegistrationAction: [{ label: 'Register' }],
      eventStart: '2026-08-01T00:00:00.000Z',
    }
    const result = await normalizeNewsEventFields({
      data,
      req: {
        context: { newsEventClassificationBehavior: 'event' },
      },
    } as never)

    expect(result).toEqual(data)
  })

  const classification = ({
    active = true,
    behavior = 'story',
    id = 'classification-1',
    legacyValue = null,
    slug = behavior === 'event' ? 'events' : 'news',
    title = behavior === 'event' ? 'Events' : 'News',
  }: {
    active?: boolean
    behavior?: NewsEventClassificationBehavior
    id?: string
    legacyValue?: string | null
    slug?: string
    title?: string
  } = {}) => ({
    active,
    badgeLabel: title,
    behavior,
    id,
    legacyValue,
    slug,
    title,
  })

  const request = ({
    byID = classification(),
    byLegacy = classification({ legacyValue: 'news' }),
  }: {
    byID?: ReturnType<typeof classification> | null
    byLegacy?: ReturnType<typeof classification> | null
  } = {}) => {
    const findByID = vi.fn().mockResolvedValue(byID)
    const find = vi.fn().mockResolvedValue({ docs: byLegacy ? [byLegacy] : [] })

    return {
      find,
      findByID,
      req: {
        context: {},
        payload: { find, findByID },
      } as unknown as PayloadRequest,
    }
  }

  it('resolves an ID-only relationship and validates Event behavior', async () => {
    const { findByID, req } = request({
      byID: classification({ behavior: 'event', id: 'event-classification', legacyValue: 'event' }),
    })

    const result = await resolveNewsEventClassification({
      data: {
        classification: 'event-classification',
        eventEnd: '2026-08-20T12:00:00.000Z',
        eventLocation: 'Main Auditorium',
        eventStart: '2026-08-20T09:00:00.000Z',
      },
      operation: 'create',
      originalDoc: undefined,
      req,
    } as never)

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        id: 'event-classification',
        req,
      }),
    )
    expect(result).toMatchObject({ classification: 'event-classification' })
    expect(req.context.newsEventClassificationBehavior).toBe('event')
  })

  it('uses canonical classification behavior and activity instead of submitted object fields', async () => {
    const canonical = classification({
      active: true,
      behavior: 'event',
      id: 'canonical-event',
      legacyValue: 'event',
    })
    const spoofed = {
      ...canonical,
      active: false,
      behavior: 'story' as const,
    }
    const { findByID, req } = request({ byID: canonical })

    const result = await resolveNewsEventClassification({
      data: {
        classification: spoofed,
        eventLocation: 'Main Auditorium',
        eventStart: '2026-08-20T09:00:00.000Z',
      },
      operation: 'create',
      originalDoc: undefined,
      req,
    } as never)

    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ id: 'canonical-event', req }))
    expect(result).toMatchObject({
      classification: 'canonical-event',
      eventLocation: 'Main Auditorium',
      eventStart: '2026-08-20T09:00:00.000Z',
    })
    expect(req.context.newsEventClassificationBehavior).toBe('event')
  })

  it('requires an explicit classification when creating an entry', async () => {
    const { req } = request()

    await expect(
      resolveNewsEventClassification({
        data: { title: 'Unclassified' },
        operation: 'create',
        originalDoc: undefined,
        req,
      } as never),
    ).rejects.toMatchObject({ message: 'Select an Entry Classification.', status: 400 })
  })

  it('uses the original legacy value only for an unmigrated update', async () => {
    const legacyClassification = classification({
      behavior: 'event',
      id: 'seeded-event',
      legacyValue: 'event',
    })
    const { find, req } = request({ byLegacy: legacyClassification })

    const result = await resolveNewsEventClassification({
      data: { title: 'Updated legacy event' },
      operation: 'update',
      originalDoc: {
        contentType: 'event',
        eventLocation: 'Campus',
        eventStart: '2026-08-20T09:00:00.000Z',
      },
      req,
    } as never)

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        req,
        where: { legacyValue: { equals: 'event' } },
      }),
    )
    expect(result).toMatchObject({ classification: 'seeded-event' })
  })

  it('rejects unknown legacy values and explicitly cleared update relationships', async () => {
    const { req } = request({ byLegacy: null })

    await expect(
      resolveNewsEventClassification({
        data: { title: 'Legacy update' },
        operation: 'update',
        originalDoc: { contentType: 'unknown' },
        req,
      } as never),
    ).rejects.toMatchObject({ message: 'Select an Entry Classification.', status: 400 })

    await expect(
      resolveNewsEventClassification({
        data: { classification: null },
        operation: 'update',
        originalDoc: { classification: 'classification-1', contentType: 'news' },
        req,
      } as never),
    ).rejects.toMatchObject({ message: 'Select an Entry Classification.', status: 400 })
  })

  it('rejects newly selected inactive classifications but preserves an unchanged archived one', async () => {
    const archived = classification({ active: false, id: 'archived' })
    const changedRequest = request({ byID: archived })

    await expect(
      resolveNewsEventClassification({
        data: { classification: 'archived' },
        operation: 'update',
        originalDoc: { classification: 'classification-1' },
        req: changedRequest.req,
      } as never),
    ).rejects.toMatchObject({
      message: 'The selected Entry Classification is archived.',
      status: 400,
    })

    const unchangedRequest = request({ byID: archived })
    await expect(
      resolveNewsEventClassification({
        data: { title: 'Keep archived relationship' },
        operation: 'update',
        originalDoc: { classification: 'archived' },
        req: unchangedRequest.req,
      } as never),
    ).resolves.toMatchObject({ classification: 'archived' })
  })

  it('enforces Event required fields and chronological order', async () => {
    const eventClassification = classification({ behavior: 'event', id: 'events' })

    for (const [data, message] of [
      [{ classification: eventClassification }, 'Event Start is required for Event entries.'],
      [
        {
          classification: eventClassification,
          eventStart: '2026-08-20T09:00:00.000Z',
        },
        'Event Location is required for Event entries.',
      ],
      [
        {
          classification: eventClassification,
          eventEnd: '2026-08-20T08:00:00.000Z',
          eventLocation: 'Campus',
          eventStart: '2026-08-20T09:00:00.000Z',
        },
        'Event End cannot be earlier than Event Start.',
      ],
      [
        {
          classification: eventClassification,
          eventAllDay: false,
          eventLocation: 'Campus',
          eventStart: '2026-08-20T09:00:00.000Z',
          featuredInHighlights: true,
        },
        'Event End is required when a timed Event is featured in Highlights.',
      ],
    ] as const) {
      const { req } = request({ byID: eventClassification })

      await expect(
        resolveNewsEventClassification({
          data,
          operation: 'create',
          originalDoc: undefined,
          req,
        } as never),
      ).rejects.toMatchObject({ message, status: 400 })
    }
  })

  it('allows a featured all-day Event without a separate end date', async () => {
    const eventClassification = classification({ behavior: 'event', id: 'events' })
    const { req } = request({ byID: eventClassification })

    await expect(
      resolveNewsEventClassification({
        data: {
          classification: eventClassification,
          eventAllDay: true,
          eventLocation: 'Campus',
          eventStart: '2026-08-20T00:00:00.000Z',
          featuredInHighlights: true,
        },
        operation: 'create',
        originalDoc: undefined,
        req,
      } as never),
    ).resolves.toMatchObject({ featuredInHighlights: true })
  })

  it('clears Event-only fields for Story behavior and exposes resolved public classification', async () => {
    const storyClassification = classification({
      behavior: 'story',
      id: 'notice-id',
      legacyValue: 'notice',
      slug: 'notices',
      title: 'Notices',
    })
    const { req } = request({ byID: storyClassification })
    const result = await resolveNewsEventClassification({
      data: {
        classification: storyClassification,
        eventEnd: '2026-08-20T12:00:00.000Z',
        featuredInHighlights: true,
        eventLocation: 'Campus',
        eventRegistrationAction: [{ label: 'Register' }],
        eventStart: '2026-08-20T09:00:00.000Z',
      },
      operation: 'create',
      originalDoc: undefined,
      req,
    } as never)

    expect(result).toMatchObject({
      classification: 'notice-id',
      eventEnd: null,
      featuredInHighlights: false,
      eventLocation: null,
      eventRegistrationAction: [],
      eventStart: null,
    })

    const card = toPublicNewsEventCard(
      {
        classification: storyClassification,
        contentType: 'notice',
        eventEnd: null,
        eventStart: null,
        excerpt: 'Notice excerpt',
        featuredImage: null,
        featuredImagePosition: 'center',
        id: 'entry-1',
        primaryCategory: null,
        publishedAt: '2026-08-20T09:00:00.000Z',
        slug: 'notice-entry',
        title: 'Notice entry',
        updatedAt: '2026-08-20T10:00:00.000Z',
      } as never,
      '2026-08-20T10:00:00.000Z',
    )

    expect(card).toMatchObject({
      behavior: 'story',
      classification: storyClassification,
      contentType: 'notices',
    })
  })

  it('synthesizes a resolved public classification for legacy entries', () => {
    const card = toPublicNewsEventCard(
      {
        classification: undefined,
        contentType: 'achievement',
        eventEnd: null,
        eventStart: null,
        excerpt: 'Achievement excerpt',
        featuredImage: null,
        featuredImagePosition: 'center',
        id: 'legacy-entry',
        primaryCategory: null,
        publishedAt: '2026-08-20T09:00:00.000Z',
        slug: 'legacy-entry',
        title: 'Legacy entry',
        updatedAt: '2026-08-20T10:00:00.000Z',
      } as never,
      '2026-08-20T10:00:00.000Z',
    )

    expect(card).toMatchObject({
      behavior: 'story',
      classification: {
        active: true,
        badgeLabel: 'Achievement',
        behavior: 'story',
        id: 'legacy:achievement',
        legacyValue: 'achievement',
        slug: 'achievement',
        title: 'Achievements',
      },
      contentType: 'achievement',
    })
  })
})

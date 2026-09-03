import { describe, expect, it } from 'vitest'

import { getNewsEventDetailMetadata, getNewsEventStructuredData } from '@/lib/newsEventsMetadata'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'

const detailFixture = (robotsMode: 'default' | 'index' | 'noindex'): PublicNewsEventDetail =>
  ({
    behavior: 'story',
    classification: {
      active: true,
      badgeLabel: 'Campus',
      behavior: 'story',
      id: 'campus-id',
      legacyValue: null,
      slug: 'campus-update',
      title: 'Campus Updates',
    },
    contentType: 'news',
    excerpt: 'News entry excerpt',
    href: '/news-events/example',
    robotsMode,
    title: 'Example news entry',
  }) as PublicNewsEventDetail

describe('News & Events metadata', () => {
  it('inherits the global detail robots policy for default mode', () => {
    expect(getNewsEventDetailMetadata(detailFixture('default'), 'index,nofollow').robots).toEqual({
      follow: false,
      index: true,
    })
  })

  it('lets an explicit detail policy override the global policy', () => {
    expect(getNewsEventDetailMetadata(detailFixture('noindex'), 'index,follow').robots).toEqual({
      follow: true,
      index: false,
    })
  })

  it('keeps NewsArticle structured data for non-event entries', () => {
    expect(
      getNewsEventStructuredData(detailFixture('default'), 'Office of the Director'),
    ).toMatchObject({
      '@type': 'NewsArticle',
      author: { '@type': 'Organization', name: 'Office of the Director' },
      headline: 'Example news entry',
      url: 'http://localhost:3000/news-events/example',
    })
  })

  it('keeps Event structured data for event entries', () => {
    expect(
      getNewsEventStructuredData({
        ...detailFixture('default'),
        behavior: 'event',
        classification: {
          active: true,
          badgeLabel: 'CME',
          behavior: 'event',
          calendarColor: 'blue',
          id: 'cme-id',
          legacyValue: null,
          slug: 'continuing-medical-education',
          title: 'Continuing Medical Education',
        },
        eventLocation: 'Main Auditorium',
        eventStart: '2026-09-10T09:00:00.000Z',
      }),
    ).toMatchObject({
      '@type': 'Event',
      location: { '@type': 'Place', name: 'Main Auditorium' },
      startDate: '2026-09-10T09:00:00.000Z',
    })
    expect(
      getNewsEventStructuredData({
        ...detailFixture('default'),
        behavior: 'event',
      }),
    ).not.toHaveProperty('author')
  })
})

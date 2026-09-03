import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { NewsEventDateMeta } from '@/components/news-events/NewsEventDateMeta'
import {
  NEWS_EVENT_CLASSIFICATIONS,
  getLegacyNewsEventClassificationRecord,
  normalizeNewsEventClassification,
} from '@/lib/newsEventClassifications'

describe('News & Events classification and date metadata', () => {
  it('normalizes supported classifications and falls back to Other', () => {
    expect(normalizeNewsEventClassification('event')).toBe('event')
    expect(normalizeNewsEventClassification('invalid')).toBe('other')
    expect(normalizeNewsEventClassification(null)).toBe('other')
  })

  it('renders configured badge labels while using the slug only as metadata', () => {
    const cme = {
      badgeLabel: 'CME',
      slug: 'continuing-medical-education',
    }
    const markup = renderToStaticMarkup(<NewsEventClassificationBadge classification={cme} />)

    expect(markup).toContain('data-news-event-classification="continuing-medical-education"')
    expect(markup).toContain('CME')
    expect(markup).not.toContain('Continuing Medical Education')
    expect(markup).toContain('border-border')
    expect(markup).toContain('bg-accent')
    expect(markup).toContain('text-accent-foreground')
    expect(markup).not.toContain('bg-transparent')
  })

  it('keeps every seeded legacy classification available during local compatibility', () => {
    for (const { label, value } of NEWS_EVENT_CLASSIFICATIONS) {
      expect(getLegacyNewsEventClassificationRecord(value)?.badgeLabel).toBe(label)
    }
  })

  it('renders a semantic, regular-weight date with a calendar icon', () => {
    const markup = renderToStaticMarkup(
      <NewsEventDateMeta
        className="text-muted-foreground"
        dateISO="2026-08-18T00:00:00.000Z"
        dateLabel="Aug 18, 2026"
      />,
    )

    expect(markup).toContain('<time')
    expect(markup).toContain('dateTime="2026-08-18T00:00:00.000Z"')
    expect(markup).toContain('lucide-calendar-days')
    expect(markup).toContain('font-sans')
    expect(markup).toContain('font-normal')
    expect(markup).toContain('tracking-normal')
    expect(markup).toContain('tabular-nums')
    expect(markup).toContain('text-xs')
  })
})

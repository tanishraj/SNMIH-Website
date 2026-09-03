import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { NewsEventsContentBlockComponent } from '@/blocks/NewsEventsContent/Component'
import { regularBlockContainerClasses } from '@/blocks/shared/blockSpacing'
import {
  DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE,
  normalizeNewsEventDetailTemplate,
  resolveNewsEventsContentSettings,
  type ResolvedNewsEventDetailTemplate,
} from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { NewsEventsContentBlock } from '@/payload-types'

const body = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'A meaningful heading',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h2',
        version: 1,
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 16,
            mode: 'normal',
            style: '',
            text: 'A complete story.',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
} as PublicNewsEventDetail['body']

const entry: PublicNewsEventDetail = {
  behavior: 'story',
  body,
  categories: [{ id: 'campus', slug: 'campus', title: 'Campus' }],
  category: { id: 'campus', slug: 'campus', title: 'Campus' },
  classification: {
    active: true,
    badgeLabel: 'Campus',
    behavior: 'story',
    calendarColor: 'blue',
    id: 'campus-classification',
    legacyValue: null,
    slug: 'campus-update',
    title: 'Campus Updates',
  },
  contentType: 'news',
  dateISO: '2026-07-19T00:00:00.000Z',
  dateLabel: 'Jul 19, 2026',
  excerpt: 'A concise introduction to the story.',
  href: '/news-events/campus-story',
  id: 'campus-story',
  image: {
    alt: 'Students working in a laboratory',
    height: 900,
    position: 'center',
    src: '/media/laboratory.jpg',
    width: 1600,
  },
  isPastEvent: false,
  slug: 'campus-story',
  tags: [{ id: 'education', slug: 'education', title: 'Education' }],
  title: 'Campus story',
  updatedAt: '2026-07-19T00:00:00.000Z',
}

const renderStory = (
  currentEntry: PublicNewsEventDetail = entry,
  template: ResolvedNewsEventDetailTemplate = DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE,
) => {
  const content = template.layout.find(({ blockType }) => blockType === 'newsEventsContent')

  if (!content)
    throw new Error('Expected the normalized template to include News & Events Content.')

  const settings = resolveNewsEventsContentSettings(content)
  const block: NewsEventsContentBlock = {
    appearance: {
      background: settings.appearance.background ?? 'none',
      border: settings.appearance.border ?? 'none',
    },
    authorLabel: settings.authorLabel,
    blockType: 'newsEventsContent',
    featuredImageRatio: settings.featuredImageRatio,
    overlayCoverage: settings.coverage,
    overlayDirection: settings.direction,
    overlayStyle: settings.strength,
    showShareActions: settings.showShareActions,
    sidebarCardBackground: settings.sidebarCardBackground,
    sidebarCardOutline: settings.sidebarCardOutline,
    size: settings.size,
    themeMode: settings.tone,
  }

  return renderToStaticMarkup(<NewsEventsContentBlockComponent {...block} entry={currentEntry} />)
}

describe('News & Events individual story', () => {
  it('renders classification and title over the image before excerpt and Lexical content', () => {
    const markup = renderStory()
    const image = markup.indexOf('data-news-event-featured-image="true"')
    const eyebrow = markup.indexOf('data-news-event-overlay-eyebrow="true"')
    const title = markup.indexOf('data-news-event-overlay-title="true"')
    const excerpt = markup.indexOf('data-news-event-excerpt="true"')
    const body = markup.indexOf('data-news-event-rich-text="true"')
    const imageFrame = markup.match(/<div[^>]*data-news-event-featured-image="true"[^>]*>/)?.[0]

    expect(markup).toContain('data-news-event-image-overlay="true"')
    expect(markup).toContain('min-h-80')
    expect(markup).toContain('md:min-h-0')
    expect(imageFrame).toContain('rounded-card')
    expect(imageFrame).not.toContain('rounded-[var(--radius)]')
    expect(markup).toContain('>Campus<')
    expect(markup).toContain('Campus story')
    expect(markup).toContain(
      'class="text-base leading-7 text-current/80 sm:text-lg" data-news-event-excerpt="true"',
    )
    expect(image).toBeLessThan(eyebrow)
    expect(eyebrow).toBeLessThan(title)
    expect(title).toBeLessThan(excerpt)
    expect(excerpt).toBeLessThan(body)
  })

  it('applies normalized overlay presentation and the bundled missing-image fallback', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'newsEventsContent',
          themeMode: 'light',
          overlayStyle: 'light',
          overlayDirection: 'rightToLeft',
          overlayCoverage: 'split',
        },
      ],
    })
    const markup = renderStory({ ...entry, image: undefined }, template)

    expect(markup).toContain('snmih-news-events-default.png')
    expect(markup).toContain('data-news-event-image-fallback="true"')
    expect(markup).toContain('data-overlay-tone="light"')
    expect(markup).toContain('data-overlay-strength="light"')
    expect(markup).toContain('data-overlay-direction="rightToLeft"')
    expect(markup).toContain('data-overlay-coverage="split"')
    expect(markup).toContain('text-light-overlay-foreground')
  })

  it('uses the website container, reading column, and right-sticky semantic sidebar', () => {
    const markup = renderStory()

    expect(markup).toContain('data-news-event-story="true"')
    expect(markup).toContain(regularBlockContainerClasses)
    expect(markup).toContain('lg:grid-cols-[minmax(0,1fr)_30rem]')
    expect(markup).toContain('lg:sticky lg:top-28')
    expect(markup).toContain('data-news-event-story-details="true"')
    expect(markup).toContain('data-news-event-detail-label="true"')
    expect(markup).toContain('data-news-event-detail-value="true"')
    expect(markup).toContain('font-mono text-xs font-normal')
    expect(markup).toContain('font-[family-name:var(--font-text)] text-sm leading-5 font-medium')
    expect(markup).not.toContain('break-words font-mono text-sm')
    expect(markup).toContain('tabular-nums')
    expect(markup).toContain('Management, SNMIH')
    expect(markup).toContain('Story Details')
    expect(markup).toContain('Share This')
    expect(markup).toContain('A meaningful heading')
    expect(markup).toContain('prose-h2:mt-9')
    expect(markup).toContain('[&amp;_pre]:max-w-full')
    expect(markup).toContain('[&amp;_a]:focus-visible:ring-2')
  })

  it('adds event-only details and registration only for Event entries', () => {
    const markup = renderStory({
      ...entry,
      behavior: 'event',
      classification: {
        active: true,
        badgeLabel: 'CME',
        behavior: 'event',
        calendarColor: 'blue',
        id: 'cme-classification',
        legacyValue: null,
        slug: 'continuing-medical-education',
        title: 'Continuing Medical Education',
      },
      eventEnd: '2026-09-11T09:00:00.000Z',
      eventLocation: 'Main Auditorium',
      eventRegistrationAction: {
        href: '/register',
        label: 'Register now',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
      eventStart: '2026-09-10T09:00:00.000Z',
    })

    expect(markup).toContain('Event Date')
    expect(markup).toContain('Main Auditorium')
    expect(markup).toContain('Register now')

    const newsMarkup = renderStory()
    expect(newsMarkup).not.toContain('Event Date')
    expect(newsMarkup).not.toContain('Main Auditorium')
    expect(newsMarkup).not.toContain('Register now')
  })

  it('hides only the share card when the dynamic block disables sharing', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'newsEventsContent',
          showShareActions: false,
        },
      ],
    })
    const markup = renderStory(entry, template)

    expect(markup).toContain('Story Details')
    expect(markup).not.toContain('Share This')
    expect(markup).not.toContain('data-news-event-share-actions')
  })
})

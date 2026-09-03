import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NewsEventsFeaturedCarouselClient } from '@/components/news-events/NewsEventsFeaturedCarouselClient'
import type { FeaturedHighlightItem } from '@/components/news-events/featuredHighlightsShared'
import {
  getLegacyNewsEventClassificationRecord,
  type NewsEventClassification,
} from '@/lib/newsEventClassifications'

const motionPreference = { reduced: false }

const item = (id: string, contentType: NewsEventClassification): FeaturedHighlightItem => {
  const classification = getLegacyNewsEventClassificationRecord(contentType)
  if (!classification) throw new Error(`Expected ${contentType} classification fixture.`)

  return {
    action: { href: `/news-events/${id}`, label: 'Read more' },
    classification,
    dateISO: '2026-08-20T09:00:00.000Z',
    dateLabel: 'Aug 20, 2026',
    description: `${id} excerpt`,
    id,
    image: { alt: `${id} image`, position: 'center', src: `/media/${id}.jpg` },
    title: `${id} title`,
  }
}

const items = [item('news-1', 'news'), item('notice-1', 'notice'), item('event-1', 'event')]

function getCarouselChildOrder(container: HTMLElement) {
  const shell = container.querySelector('[data-news-events-carousel-shell="true"]')
  if (!shell) throw new Error('Expected carousel shell')

  return Array.from(shell.children).map((child) => {
    if (child.hasAttribute('data-news-events-carousel-layout')) return 'layout'
    if (child.hasAttribute('data-news-events-carousel-controls-position')) return 'controls'
    if (child.querySelector('[data-news-events-carousel-rail="horizontal"]')) return 'mobile-rail'
    return 'other'
  })
}

describe('NewsEventsFeaturedCarouselClient', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    motionPreference.reduced = false
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        matches: motionPreference.reduced,
        removeEventListener: vi.fn(),
      })),
    )
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect() {}
        observe() {}
        takeRecords() {
          return []
        }
        unobserve() {}
      },
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    )
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps a three-card side rail visible from tablet widths and matches the feature height', () => {
    const { container } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={items} />,
    )

    const layout = container.querySelector('[data-news-events-carousel-layout="true"]')
    const feature = container.querySelector('[data-news-events-carousel-feature="true"]')
    const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
    const verticalRail = verticalContent?.closest('[data-slot="carousel"]')
    const horizontalContent = container.querySelector(
      '[data-news-events-carousel-rail="horizontal"]',
    )
    const horizontalRail = horizontalContent?.closest('[data-slot="carousel"]')
    const verticalSlides = verticalContent?.querySelectorAll('[data-slot="carousel-item"]') ?? []
    const verticalCards =
      verticalContent?.querySelectorAll('[data-news-events-carousel-rail-card="true"]') ?? []
    const verticalTitles = Array.from(verticalCards).map((card) =>
      card.querySelector('[data-slot="card-title"]'),
    )
    const verticalDescriptions = Array.from(verticalCards).map((card) =>
      card.querySelector('[data-slot="card-content"] p'),
    )
    const verticalDates = verticalContent?.querySelectorAll('time') ?? []
    const railBadges = verticalContent?.querySelectorAll('[data-news-event-classification]') ?? []
    const featureDate = feature?.querySelector('time')
    const featureBadge = feature?.querySelector('[data-news-event-classification]')

    expect(layout?.className).toContain('md:h-[36rem]')
    expect(layout?.className).toContain('md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]')
    expect(feature?.className).toContain('md:h-full')
    expect(feature?.className).toContain('md:min-h-0')
    expect(feature?.className).toContain('rounded-card')
    expect(feature?.className).not.toContain('rounded-[var(--radius)]')
    expect(feature?.className).toContain('ring-inset')
    expect(verticalRail?.className).toContain('hidden h-[36rem] md:block')
    expect(verticalContent?.className).toContain('mt-0')
    expect(verticalContent?.className).toContain('h-[36rem]')
    expect(verticalContent?.className).toContain('gap-4')
    expect(verticalSlides).toHaveLength(3)
    expect(
      Array.from(verticalSlides).every(
        (slide) =>
          slide.className.includes('basis-[calc((100%_-_2rem)/3)]') &&
          slide.className.includes('pt-0'),
      ),
    ).toBe(true)
    expect(verticalCards).toHaveLength(3)
    expect(Array.from(verticalCards).every((card) => card.className.includes('rounded-card'))).toBe(
      true,
    )
    expect(
      Array.from(verticalCards).every(
        (card) => !card.className.includes('rounded-[var(--radius)]'),
      ),
    ).toBe(true)
    expect(Array.from(verticalCards).every((card) => card.className.includes('h-full'))).toBe(true)
    expect(
      Array.from(verticalCards).every((card) => card.className.includes('justify-center')),
    ).toBe(true)
    expect(Array.from(verticalCards).every((card) => card.className.includes('ring-inset'))).toBe(
      true,
    )
    expect(
      Array.from(verticalCards).every((card) => card.className.includes('overflow-hidden')),
    ).toBe(true)
    expect(verticalTitles.every((title) => title?.className.includes('line-clamp-1'))).toBe(true)
    expect(verticalTitles.every((title) => title?.className.includes('text-xl'))).toBe(true)
    expect(verticalTitles.every((title) => title?.className.includes('font-semibold'))).toBe(true)
    expect(
      verticalDescriptions.every((description) => description?.className.includes('line-clamp-2')),
    ).toBe(true)
    expect(
      verticalDescriptions.every((description) => description?.className.includes('text-base')),
    ).toBe(true)
    expect(
      verticalDescriptions.every((description) => description?.className.includes('font-normal')),
    ).toBe(true)
    expect(Array.from(verticalDates).every((date) => date.className.includes('font-sans'))).toBe(
      true,
    )
    expect(Array.from(verticalDates).every((date) => date.className.includes('font-normal'))).toBe(
      true,
    )
    expect(
      Array.from(verticalDates).every((date) => date.className.includes('tracking-normal')),
    ).toBe(true)
    expect(Array.from(verticalDates).every((date) => date.className.includes('tabular-nums'))).toBe(
      true,
    )
    expect(Array.from(verticalDates).every((date) => date.className.includes('text-xs'))).toBe(true)
    expect(featureDate?.className).toContain('text-sm')
    expect(featureBadge?.className).toContain('border-border')
    expect(featureBadge?.className).toContain('bg-accent')
    expect(featureBadge?.className).toContain('text-accent-foreground')
    expect(Array.from(railBadges).every((badge) => badge.className.includes('border-border'))).toBe(
      true,
    )
    expect(Array.from(railBadges).every((badge) => badge.className.includes('bg-accent'))).toBe(
      true,
    )
    expect(
      Array.from(railBadges).every((badge) => badge.className.includes('text-accent-foreground')),
    ).toBe(true)
    expect(
      container.querySelectorAll('[data-news-event-classification="news"]').length,
    ).toBeGreaterThan(0)
    expect(
      Array.from(verticalCards).every((card) => {
        const header = card.querySelector('[data-slot="card-header"]')
        const content = card.querySelector('[data-slot="card-content"]')

        return (
          header?.className.includes('px-5') &&
          header.className.includes('pt-5') &&
          content?.className.includes('px-5') &&
          content.className.includes('pt-3') &&
          content.className.includes('pb-5')
        )
      }),
    ).toBe(true)
    expect(horizontalRail?.className).toContain('md:hidden')
  })

  it('keeps the final outline inside the viewport when five stories are selected', () => {
    const fiveItems = [...items, item('holiday-1', 'holiday'), item('other-1', 'other')]
    const { container } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={fiveItems} />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: `Show ${fiveItems[4].title}` })[0])

    expect(screen.getByText('5 of 5')).toBeTruthy()
    const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
    const railCards =
      verticalContent?.querySelectorAll('[data-news-events-carousel-rail-card="true"]') ?? []
    expect(railCards).toHaveLength(5)
    expect(Array.from(railCards).every((card) => card.className.includes('ring-inset'))).toBe(true)
  })

  it('selects rail stories and wraps the manual controls', () => {
    render(<NewsEventsFeaturedCarouselClient autoplay items={items} sectionBackground="none" />)

    expect(screen.getByRole('heading', { name: items[0].title })).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: `Show ${items[1].title}` })[0])
    expect(screen.getByRole('heading', { name: items[1].title })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }))
    expect(screen.getByRole('heading', { name: items[0].title })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Previous story' }))
    expect(screen.getByRole('heading', { name: items[2].title })).toBeTruthy()
    expect(screen.getByText('3 of 3')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next story' }))
    expect(screen.getByText('1 of 3')).toBeTruthy()
  })

  it('places one controls row above the carousel when configured', () => {
    const { container } = render(
      <NewsEventsFeaturedCarouselClient
        autoplay={false}
        carouselControlsPosition="top"
        items={items}
      />,
    )

    const controls = container.querySelectorAll(
      '[data-news-events-carousel-controls-position="top"]',
    )
    expect(controls).toHaveLength(1)
    expect(getCarouselChildOrder(container).slice(0, 2)).toEqual(['controls', 'layout'])
    expect(controls[0]?.className).toContain('border-b')
    expect(controls[0]?.className).toContain('pb-4')
  })

  it('defaults missing and invalid controls positions to the bottom', () => {
    const { container, rerender } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={items} />,
    )

    expect(
      container.querySelectorAll('[data-news-events-carousel-controls-position="bottom"]'),
    ).toHaveLength(1)
    expect(getCarouselChildOrder(container).slice(-2)).toEqual(['mobile-rail', 'controls'])

    rerender(
      <NewsEventsFeaturedCarouselClient
        autoplay={false}
        carouselControlsPosition={'side' as never}
        items={items}
      />,
    )

    expect(
      container.querySelectorAll('[data-news-events-carousel-controls-position="bottom"]'),
    ).toHaveLength(1)
    expect(getCarouselChildOrder(container).slice(-2)).toEqual(['mobile-rail', 'controls'])
  })

  it('advances every six seconds and pauses for hover and focus', () => {
    render(<NewsEventsFeaturedCarouselClient autoplay items={items} />)
    const shell = screen.getByTestId('news-events-carousel-shell')

    act(() => vi.advanceTimersByTime(6000))
    expect(screen.getByRole('heading', { name: items[1].title })).toBeTruthy()

    fireEvent.mouseEnter(shell)
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.getByRole('heading', { name: items[1].title })).toBeTruthy()

    fireEvent.mouseLeave(shell)
    fireEvent.focus(screen.getByRole('button', { name: 'Next story' }))
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.getByRole('heading', { name: items[1].title })).toBeTruthy()
  })

  it('disables autoplay for reduced motion and for a single item', () => {
    motionPreference.reduced = true
    const { rerender } = render(<NewsEventsFeaturedCarouselClient autoplay items={items} />)

    act(() => vi.advanceTimersByTime(12000))
    expect(screen.getByRole('heading', { name: items[0].title })).toBeTruthy()

    rerender(<NewsEventsFeaturedCarouselClient autoplay items={items.slice(0, 1)} />)
    expect(screen.queryByRole('button', { name: 'Next story' })).toBeNull()
    expect(screen.getByText('1 of 1')).toBeTruthy()
  })

  it('uses the branded default image when featured media is missing', () => {
    const holiday = { ...item('holiday-1', 'holiday'), image: undefined }
    const { container } = render(
      <NewsEventsFeaturedCarouselClient
        autoplay={false}
        imagePositionOverride="left"
        items={[holiday]}
      />,
    )

    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0)
    const image = container.querySelector('img')
    expect(image).toBeTruthy()
    expect(image?.getAttribute('src')).toContain('snmih-news-events-default.png')
    expect(image?.getAttribute('alt')).toBe('')
    expect(image?.className).toContain('object-center')
    expect(image?.className).not.toContain('object-left')
    expect(image?.getAttribute('data-news-events-image-fallback')).toBe('true')
    expect(container.querySelector('[data-news-events-image-overlay="true"]')).toBeTruthy()
  })

  it('prefers authored featured media over the branded fallback', () => {
    const { container } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={[items[0]]} />,
    )

    const image = container.querySelector('img')
    expect(image?.getAttribute('src')).toContain('news-1.jpg')
    expect(image?.getAttribute('alt')).toBe('news-1 image')
    expect(image?.hasAttribute('data-news-events-image-fallback')).toBe(false)
  })

  it('switches to the branded fallback when authored media fails to load', () => {
    const { container } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={[items[0]]} />,
    )

    const authoredImage = container.querySelector('img')
    expect(authoredImage?.getAttribute('src')).toContain('news-1.jpg')

    fireEvent.error(authoredImage as HTMLImageElement)

    const fallbackImage = container.querySelector('img')
    expect(fallbackImage?.getAttribute('src')).toContain('snmih-news-events-default.png')
    expect(fallbackImage?.getAttribute('data-news-events-image-fallback')).toBe('true')
  })

  it('omits optional metadata, description, and action without empty placeholders', () => {
    const minimalItem: FeaturedHighlightItem = { id: 'minimal', title: 'Minimal highlight' }
    const { container } = render(
      <NewsEventsFeaturedCarouselClient autoplay={false} items={[minimalItem]} />,
    )

    const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
    const verticalSlide = verticalContent?.querySelector('[data-slot="carousel-item"]')
    const verticalButton = verticalSlide?.querySelector('[data-slot="button"]')
    const verticalCard = verticalSlide?.querySelector(
      '[data-news-events-carousel-rail-card="true"]',
    )
    const horizontalContent = container.querySelector(
      '[data-news-events-carousel-rail="horizontal"]',
    )
    const horizontalButton = horizontalContent?.querySelector('[data-slot="button"]')

    expect(screen.getByRole('heading', { name: 'Minimal highlight' })).toBeTruthy()
    expect(container.querySelector('.lucide-calendar-days')).toBeNull()
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
    expect(container.querySelector('[data-content-link="true"]')).toBeNull()
    expect(container.querySelector('[data-slot="card-content"]')).toBeNull()
    expect(verticalSlide?.className).toContain('w-full')
    expect(verticalButton?.className).toContain('h-full')
    expect(verticalButton?.className).toContain('w-full')
    expect(verticalCard?.className).toContain('h-full')
    expect(verticalCard?.className).toContain('w-full')
    expect(horizontalButton?.className).toContain('h-auto')
    expect(horizontalButton?.className).toContain('w-full')
  })

  it('applies block-wide image positioning and overlay settings', () => {
    const positionedItem = {
      ...items[0],
      image: { ...items[0].image!, position: 'top' as const },
    }
    const { container } = render(
      <NewsEventsFeaturedCarouselClient
        autoplay={false}
        imagePositionOverride="left"
        items={[positionedItem]}
        overlay={{
          coverage: 'split',
          direction: 'leftToRight',
          strength: 'light',
          tone: 'brand',
        }}
      />,
    )

    expect(container.querySelector('img')?.className).toContain('object-left')
    const overlay = container.querySelector('[data-news-events-image-overlay="true"]')
    expect(overlay?.getAttribute('data-overlay-tone')).toBe('brand')
    expect(overlay?.getAttribute('data-overlay-strength')).toBe('light')
    expect(overlay?.getAttribute('data-overlay-direction')).toBe('leftToRight')
    expect(overlay?.getAttribute('data-overlay-coverage')).toBe('split')
    expect(overlay?.className).toContain('w-1/2')
  })
})

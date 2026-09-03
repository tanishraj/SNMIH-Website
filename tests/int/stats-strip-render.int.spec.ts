import { act, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedMetricValue } from '@/blocks/StatsStrip/AnimatedMetricValue'
import { StatsStripBlockComponent } from '@/blocks/StatsStrip/Component'

describe('stats strip block', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    cleanup()
  })

  it.each([
    ['none', 'border-foreground/15'],
    ['subtle', 'border-foreground/15'],
    ['brand', 'border-primary-foreground/15'],
    ['gradient-subtle', 'border-foreground/15'],
    ['gradient-brand', 'border-primary-foreground/15'],
  ] as const)('adapts internal dividers to the %s background', (background, dividerClass) => {
    const { container } = render(
      createElement(StatsStripBlockComponent, {
        appearance: { background, border: 'top' },
        items: [
          { label: 'Students', value: 750 },
          { label: 'Seats', value: 150 },
          { label: 'Faculty', value: 300 },
          { label: 'Clinical sites', value: 14 },
          { label: 'Programs', value: 8 },
        ],
      }),
    )

    const firstArticle = container.querySelector('article')
    const rowDivider = container.querySelector('[data-stats-strip-row-divider="true"]')

    expect(firstArticle?.className).toContain(dividerClass)
    expect(rowDivider?.className).toContain(dividerClass)
    expect(firstArticle?.className).not.toContain('border-r border-border')
    expect(rowDivider?.className).not.toContain('border-t border-border')
  })

  it('renders items sequentially across rows and adds a divider before later rows', () => {
    const html = renderToStaticMarkup(
      createElement(StatsStripBlockComponent, {
        appearance: {
          background: 'subtle',
          border: 'bottom',
        },
        items: [
          { label: 'Years of training physicians', value: 112 },
          { label: 'Student-to-faculty ratio', suffix: ':1', value: 9 },
          { label: 'Annual research funding', prefix: '$', suffix: 'M', value: 186 },
          { label: 'Residency match rate', suffix: '%', value: 96 },
          { label: 'Clinical sites', value: 14 },
          { label: 'Successful operations', suffix: 'K', value: 40 },
        ],
      }),
    )

    expect(html).toContain('data-stats-strip-background="subtle"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-b border-border')
    expect(html).toContain('data-stats-strip-row="0"')
    expect(html).toContain('data-stats-strip-row="1"')
    expect(html).toContain('data-stats-strip-row-size="4"')
    expect(html).toContain('data-stats-strip-row-size="2"')
    expect(html).toContain('data-stats-strip-row-divider="true"')
    expect(html).toContain('Years of training physicians')
    expect(html).toContain('Student-to-faculty ratio')
    expect(html.indexOf('Clinical sites')).toBeLessThan(html.indexOf('Successful operations'))
  })

  it('applies the mobile right divider only to the first item in each two-column mobile row', () => {
    const { container } = render(
      createElement(StatsStripBlockComponent, {
        items: [
          { label: 'Current students', value: 750 },
          { label: 'Available seats', value: 300 },
          { label: 'Experienced faculties', value: 300 },
          { label: 'Successful operations', suffix: 'K', value: 40 },
        ],
      }),
    )

    const articles = Array.from(container.querySelectorAll('article'))
    const hasMobileDivider = (article: Element | undefined) =>
      article?.className.split(/\s+/).includes('border-r') ?? false

    expect(articles).toHaveLength(4)
    expect(hasMobileDivider(articles[0])).toBe(true)
    expect(hasMobileDivider(articles[1])).toBe(false)
    expect(hasMobileDivider(articles[2])).toBe(true)
    expect(hasMobileDivider(articles[3])).toBe(false)
  })

  it('animates only the numeric value and preserves prefix and suffix', () => {
    const observerCallback = vi.fn()

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback.mockImplementation(() =>
          callback([{ isIntersecting: true }] as IntersectionObserverEntry[], this as never),
        )
      }

      disconnect() {}

      observe() {
        observerCallback()
      }

      unobserve() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as never)
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }),
    )

    render(
      createElement(AnimatedMetricValue, {
        durationMs: 1200,
        prefix: '$',
        suffix: 'M',
        triggerOnce: true,
        value: 186,
      }),
    )

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('$0M')

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('$186M')
  })

  it('renders the final value immediately when reduced motion is enabled', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    )

    render(
      createElement(AnimatedMetricValue, {
        durationMs: 1200,
        suffix: '%',
        triggerOnce: true,
        value: 96,
      }),
    )

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('96%')
  })

  it('switches immediately to the final value when reduced-motion preference changes', () => {
    let matches = false
    let changeListener: (() => void) | undefined

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: (_type: string, listener: () => void) => {
          changeListener = listener
        },
        get matches() {
          return matches
        },
        removeEventListener: vi.fn(),
      }),
    )

    render(createElement(AnimatedMetricValue, { suffix: '%', value: 96 }))
    expect(screen.getByTestId('stats-strip-value').textContent).toBe('0%')

    act(() => {
      matches = true
      changeListener?.()
    })

    expect(screen.getByTestId('stats-strip-value').textContent).toBe('96%')
  })
})

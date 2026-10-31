// @vitest-environment jsdom
import { createElement } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ReviewSubmissionBlockComponent } from '@/blocks/ReviewSubmission/Component'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('review submission block', () => {
  it('ignores browser-injected form identifiers during hydration', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    )

    const element = createElement(ReviewSubmissionBlockComponent, {
      form: {
        fields: [],
        slug: 'reviews',
        submitButtonLabel: 'Submit review',
        successMessage: 'Thanks for your review.',
        title: 'Reviews',
      },
      title: 'Share your experience',
    })
    const container = document.createElement('div')
    container.innerHTML = renderToString(element)
    document.body.append(container)

    const mutatedElements = [
      container.querySelector('form'),
      container.querySelector('#reviewer-name'),
      container.querySelector('#reviewer-email'),
      container.querySelector('#review-body'),
      container.querySelector('input[name="website"]'),
    ]

    expect(mutatedElements.every(Boolean)).toBe(true)
    mutatedElements.forEach((element, index) => {
      element?.setAttribute('__gcruniqueid', String(index + 1))
    })

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(element, { container, hydrate: true })

    await waitFor(() => {
      expect(container.querySelector('form')).not.toBeNull()
    })

    const hydrationOutput = consoleError.mock.calls.flat().join(' ')
    expect(hydrationOutput).not.toContain('__gcruniqueid')
    expect(hydrationOutput).not.toContain('hydrated but some attributes')
  })

  it.each([
    ['compact', 'py-8 md:py-10'],
    ['default', 'py-12 md:py-16'],
    ['comfortable', 'py-20 md:py-28'],
  ] as const)('uses the shared responsive spacing for %s size', (size, classes) => {
    const html = renderToStaticMarkup(
      createElement(ReviewSubmissionBlockComponent, {
        size,
        title: 'Share your experience',
      }),
    )

    expect(html).toContain(`data-review-submission-size="${size}"`)
    expect(html).toContain(classes)
  })

  it('aligns only the content header while preserving shared description typography', () => {
    const centerHtml = renderToStaticMarkup(
      createElement(ReviewSubmissionBlockComponent, {
        actions: [
          {
            label: 'Read review policy',
            linkType: 'custom',
            url: '/reviews',
          },
          {
            label: 'External policy',
            linkType: 'custom',
            openInNewTab: true,
            url: 'https://example.com/policy',
          },
        ],
        contentAlignment: 'center',
        description: 'Every review is read by our student affairs office.',
        eyebrow: 'Feedback',
        title: 'Your voice is part of the record.',
      }),
    )
    const rightHtml = renderToStaticMarkup(
      createElement(ReviewSubmissionBlockComponent, {
        contentAlignment: 'right',
        description: 'Every review is read by our student affairs office.',
        title: 'Your voice is part of the record.',
      }),
    )

    expect(centerHtml).toContain('data-review-submission-content-alignment="center"')
    expect(centerHtml).toContain('self-center items-center text-center')
    expect(centerHtml).toContain('text-base leading-7 text-current/70')
    expect(centerHtml).toContain('data-review-submission-actions="true"')
    expect(centerHtml).toContain('data-action-mode="link"')
    expect(centerHtml).toContain('justify-center')
    expect(centerHtml).toContain('href="/reviews"')
    expect(centerHtml).toContain('href="https://example.com/policy"')
    expect(centerHtml).toContain('target="_blank"')
    expect(centerHtml).toContain('rel="noreferrer"')
    expect(centerHtml).toContain('group-hover/button:translate-x-1')
    expect(rightHtml).toContain('data-review-submission-content-alignment="right"')
    expect(rightHtml).toContain('self-end items-end text-right')
  })

  it('renders shared actions as theme-aware buttons', () => {
    const html = renderToStaticMarkup(
      createElement(ReviewSubmissionBlockComponent, {
        actions: [
          {
            label: 'Review guidelines',
            linkType: 'custom',
            mode: 'button',
            url: '/guidelines',
            variant: 'default',
          },
          {
            label: 'Contact support',
            linkType: 'custom',
            mode: 'button',
            url: '/support',
            variant: 'outline',
          },
        ],
        contentAlignment: 'right',
        description: 'Every review is read by our student affairs office.',
        title: 'Your voice is part of the record.',
      }),
    )

    expect(html).toContain('data-review-submission-actions="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="default"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('sm:justify-end')
  })
})

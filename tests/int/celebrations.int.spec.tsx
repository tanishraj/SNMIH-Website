import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CelebrationBlock } from '@/blocks/Celebration/config'
import { Celebrations } from '@/collections/Celebrations'
import { CelebrationCard, getCelebrationWidth } from '@/components/celebration/CelebrationCard'
import { CelebrationPreview } from '@/components/celebration/CelebrationPreview'
import { CelebrationHost } from '@/components/celebration/CelebrationHost'
import {
  clampConfettiPieces,
  clampConfettiShots,
  clampTimesPerDay,
  isCelebrationActiveOn,
  parseCelebrationViewRecord,
  recordCelebrationOpen,
  shouldAutoOpenCelebration,
} from '@/lib/celebrations/shared'
import { toCelebrationView, type CelebrationView } from '@/lib/celebrations/view'
import type { Celebration } from '@/payload-types'

vi.mock('@/components/celebration/confetti', () => ({
  launchConfetti: vi.fn(() => () => {}),
  prefersReducedMotion: () => false,
}))

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>()
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, String(value)),
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const doc = (overrides: Partial<Celebration> = {}): Celebration =>
  ({
    id: 'c1',
    title: "Founder's Day 2027",
    enabled: true,
    placement: 'everyPage',
    // 22 Oct 2026, 00:00 IST is 21 Oct 18:30 UTC.
    startDate: '2026-10-21T18:30:00.000Z',
    heading: 'Happy',
    accentHeading: "Founder's Day",
    style: 'aurora',
    frequency: 'oncePerDay',
    confettiEnabled: true,
    confettiShots: 8,
    confettiSpeed: 'slow',
    updatedAt: '',
    createdAt: '',
    ...overrides,
  }) as Celebration

describe('celebration schedule', () => {
  it('is active from the start day through the end day, inclusive', () => {
    expect(isCelebrationActiveOn({ startKey: '2026-10-22' }, '2026-10-22')).toBe(true)
    expect(isCelebrationActiveOn({ startKey: '2026-10-22' }, '2026-10-23')).toBe(false)
    const range = { startKey: '2026-10-20', endKey: '2026-10-22' }
    expect(isCelebrationActiveOn(range, '2026-10-19')).toBe(false)
    expect(isCelebrationActiveOn(range, '2026-10-21')).toBe(true)
    expect(isCelebrationActiveOn(range, '2026-10-22')).toBe(true)
    expect(isCelebrationActiveOn(range, '2026-10-23')).toBe(false)
  })

  it('reads dates on the site calendar, not the server or visitor clock', () => {
    const view = toCelebrationView(doc(), 'Asia/Kolkata')
    expect(view?.startKey).toBe('2026-10-22')
    expect(view?.endKey).toBe('2026-10-22')
    expect(toCelebrationView(doc(), 'UTC')?.startKey).toBe('2026-10-21')
  })
})

describe('celebration frequency', () => {
  const today = '2026-10-22'

  it('opens once per day by default and again the next day', () => {
    const first = recordCelebrationOpen({}, today)
    expect(
      shouldAutoOpenCelebration({ frequency: 'oncePerDay', record: {}, todayKey: today }),
    ).toBe(true)
    expect(
      shouldAutoOpenCelebration({ frequency: 'oncePerDay', record: first, todayKey: today }),
    ).toBe(false)
    expect(
      shouldAutoOpenCelebration({ frequency: 'oncePerDay', record: first, todayKey: '2026-10-23' }),
    ).toBe(true)
  })

  it('supports every page load, once ever, and a number of times per day', () => {
    const opened = recordCelebrationOpen({}, today)
    expect(
      shouldAutoOpenCelebration({ frequency: 'everyPageLoad', record: opened, todayKey: today }),
    ).toBe(true)
    expect(
      shouldAutoOpenCelebration({
        frequency: 'oncePerVisitor',
        record: opened,
        todayKey: '2026-10-25',
      }),
    ).toBe(false)

    let record = {}
    const opens: boolean[] = []
    for (let i = 0; i < 4; i++) {
      const open = shouldAutoOpenCelebration({
        frequency: 'timesPerDay',
        record,
        timesPerDay: 3,
        todayKey: today,
      })
      opens.push(open)
      if (open) record = recordCelebrationOpen(record, today)
    }
    expect(opens).toEqual([true, true, true, false])
  })

  it('ignores corrupt storage and clamps numeric settings', () => {
    expect(parseCelebrationViewRecord('nope')).toEqual({})
    expect(parseCelebrationViewRecord('{"day":"bad","opensToday":-3,"seen":true}')).toEqual({
      day: undefined,
      opensToday: 0,
      seen: true,
    })
    expect(clampTimesPerDay(0)).toBe(1)
    expect(clampTimesPerDay(99)).toBe(20)
    expect(clampConfettiShots(undefined)).toBe(5)
    expect(clampConfettiShots(50)).toBe(8)
    expect(clampConfettiPieces(undefined)).toBe(160)
    expect(clampConfettiPieces(5)).toBe(20)
    expect(clampConfettiPieces(999)).toBe(300)
  })
})

describe('celebration view', () => {
  it('hides disabled celebrations and ones without a heading or image', () => {
    expect(toCelebrationView(doc({ enabled: false }), 'Asia/Kolkata')).toBeNull()
    expect(toCelebrationView(doc({ heading: ' ', accentHeading: null }), 'Asia/Kolkata')).toBeNull()
    expect(toCelebrationView('c1', 'Asia/Kolkata')).toBeNull()
  })

  it('maps confetti and badge defaults', () => {
    const view = toCelebrationView(
      doc({ confettiShots: null, confettiSpeed: null }),
      'Asia/Kolkata',
    )
    expect(view?.confetti).toEqual({ enabled: true, pieces: 160, shots: 5, speed: 'medium' })
    expect(view?.badgeLabel).toBe('Celebrating today')
    expect(view?.imageSize).toBe('medium')
    expect(view?.dateLabel).toEqual({ day: '22', month: 'October', year: '2026' })
  })
})

describe('celebration schema', () => {
  const names = (fields: unknown[]): string[] =>
    (fields as Array<Record<string, unknown>>).flatMap((field) => [
      ...(typeof field.name === 'string' ? [field.name] : []),
      ...(Array.isArray(field.fields) ? names(field.fields) : []),
      ...(Array.isArray(field.tabs)
        ? (field.tabs as Array<{ fields: unknown[] }>).flatMap((tab) => names(tab.fields))
        : []),
    ])

  it('offers scheduling, five styles, frequency, and confetti controls', () => {
    expect(Celebrations.slug).toBe('celebrations')
    expect(Celebrations.versions).toMatchObject({ drafts: true })
    expect(names(Celebrations.fields)).toEqual(
      expect.arrayContaining([
        'enabled',
        'placement',
        'startDate',
        'endDate',
        'style',
        'frequency',
        'timesPerDay',
        'imageOnly',
        'imageSize',
        'image',
        'heading',
        'message',
        'actions',
        'confettiEnabled',
        'confettiShots',
        'confettiPieces',
        'confettiSpeed',
      ]),
    )
  })

  it('keeps the queryable last day in step with the window', async () => {
    const hook = Celebrations.hooks!.beforeValidate![0]!
    const single = (await hook({ data: { startDate: '2026-10-22' } } as never)) as Record<
      string,
      unknown
    >
    const range = (await hook({
      data: { startDate: '2026-10-20', endDate: '2026-10-25' },
    } as never)) as Record<string, unknown>
    expect(single.lastDay).toBe('2026-10-22')
    expect(range.lastDay).toBe('2026-10-25')
  })

  it('lets a page block pick one published celebration', () => {
    expect(CelebrationBlock.slug).toBe('celebration')
    expect(CelebrationBlock.fields[0]).toMatchObject({
      name: 'celebration',
      relationTo: 'celebrations',
      filterOptions: { _status: { equals: 'published' } },
    })
  })
})

describe('celebration rendering', () => {
  const view = toCelebrationView(doc(), 'Asia/Kolkata') as CelebrationView

  it.each(['aurora', 'ticket', 'poster', 'glass', 'medallion'] as const)(
    'renders the %s style',
    (style) => {
      const html = renderToStaticMarkup(
        <CelebrationCard view={{ ...view, style, highlight: '25' }} />,
      )
      expect(html).toContain(`data-celebration-style="${style}"`)
      expect(html).toContain('Founder&#x27;s Day')
    },
  )

  it('renders image-only mode with an accessible title', () => {
    const html = renderToStaticMarkup(
      <CelebrationCard
        view={{ ...view, image: { alt: 'Diwali poster', src: '/p.jpg' }, imageOnly: true }}
      />,
    )
    expect(html).toContain('data-celebration-image-only="true"')
    expect(html).toContain('class="sr-only"')
  })

  it.each([
    ['small', 560],
    ['medium', 720],
    ['large', 960],
  ] as const)('uses the %s image size in the popup and preview', (imageSize, width) => {
    const sized = toCelebrationView(doc({ imageSize }), 'Asia/Kolkata')!
    const imageView = {
      ...sized,
      image: { alt: 'Invitation', src: '/invitation.jpg' },
      imageOnly: true,
    }
    expect(getCelebrationWidth(imageView)).toBe(width)
    expect(renderToStaticMarkup(<CelebrationPreview view={imageView} />)).toContain(
      `--cel-width:${width}px`,
    )
    expect(getCelebrationWidth({ ...imageView, imageOnly: false })).toBe(520)
  })

  it('defaults older image-only views to Medium', () => {
    expect(
      getCelebrationWidth({
        ...view,
        imageOnly: true,
        imageSize: undefined,
        image: { alt: 'Invitation', src: '/invitation.jpg' },
      }),
    ).toBe(720)
  })

  it('renders nothing on the server so cached pages never show the wrong day', () => {
    expect(
      renderToStaticMarkup(
        <CelebrationHost celebrations={[view]} priority="site" timeZone="Asia/Kolkata" />,
      ),
    ).toBe('')
  })

  it('opens on its day, records the view, closes, and reopens from the badge', async () => {
    vi.useFakeTimers({
      toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    vi.setSystemTime(new Date('2026-10-22T06:00:00.000Z'))

    render(
      <CelebrationHost
        celebrations={[{ ...view, openDelayMs: 0 }]}
        priority="site"
        timeZone="Asia/Kolkata"
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(10)
    })

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(JSON.parse(window.localStorage.getItem('celebration:c1') ?? '{}')).toMatchObject({
      day: '2026-10-22',
      opensToday: 1,
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close celebration' }))
    })
    expect(screen.queryByRole('dialog')).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Celebrating today/ }))
    })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('stays hidden outside its dates', async () => {
    vi.useFakeTimers({
      toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
    vi.setSystemTime(new Date('2026-10-24T06:00:00.000Z'))

    render(
      <CelebrationHost
        celebrations={[{ ...view, openDelayMs: 0 }]}
        priority="site"
        timeZone="Asia/Kolkata"
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(10)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

'use client'

import { useState } from 'react'

import { CELEBRATION_STYLE_OPTIONS, type CelebrationStyle } from '@/lib/celebrations/shared'
import { getZonedToday } from '@/lib/siteTimeZone'
import type { CelebrationView } from '@/lib/celebrations/view'

import { CelebrationHost } from './CelebrationHost'
import { CelebrationPreview } from './CelebrationPreview'

const example = (style: CelebrationStyle, date: string, id: string): CelebrationView => ({
  id,
  style,
  startKey: date,
  endKey: date,
  dateLabel: { day: '27', month: 'October', year: '2026' },
  eyebrow: 'The SNMIH community',
  heading: 'A new chapter.',
  accentHeading: 'Together.',
  message: 'Celebrating our students, our teachers, and the journeys that begin here.',
  signature: 'With warm wishes',
  signatureRole: 'The SNMIH family',
  highlight: '25',
  image: {
    src:
      style === 'aurora'
        ? '/block-thumbnail-assets/portrait.svg'
        : '/block-thumbnail-assets/editorial-landscape.svg',
    alt: 'Illustrative celebration preview',
  },
  imageOnly: false,
  badgeLabel: 'Preview celebration',
  frequency: 'everyPageLoad',
  timesPerDay: 1,
  openDelayMs: 0,
  showReopenBadge: false,
  confetti: { enabled: true, pieces: 160, shots: 5, speed: 'medium' },
})

/** Development-only gallery: real cards and modal behaviour, without changing CMS records. */
export function CelebrationExamples() {
  const [active, setActive] = useState<CelebrationView | null>(null)
  const [iteration, setIteration] = useState(0)

  const open = (style: CelebrationStyle) => {
    const next = iteration + 1
    setIteration(next)
    setActive(example(style, getZonedToday(new Date(), 'Asia/Kolkata'), `example-${next}`))
  }

  return (
    <main className="h-dvh overflow-y-auto bg-background px-4 py-12 text-foreground md:px-12">
      <header className="mx-auto mb-10 max-w-5xl">
        <p className="mb-3 text-sm font-medium text-muted-foreground">SNMIH · Local preview</p>
        <h1 className="text-4xl font-semibold">Five ways to celebrate</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Open any example to see the celebration with two party cones and confetti. These examples
          use illustrative content.
        </p>
        <nav aria-label="Celebration examples" className="mt-6 flex flex-wrap gap-3">
          {CELEBRATION_STYLE_OPTIONS.map(({ label, value }) => (
            <button
              className="min-h-11 rounded-control border border-border px-4 py-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4"
              key={value}
              onClick={() => open(value)}
              type="button"
            >
              {label.split(' (')[0]}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8">
        {CELEBRATION_STYLE_OPTIONS.map(({ label, value }) => (
          <section className="min-w-0" key={value}>
            <div className="flex flex-wrap items-center justify-between gap-4 px-4">
              <h2 className="text-xl font-semibold">{label.split(' (')[0]}</h2>
              <button
                className="min-h-11 rounded-control bg-primary px-5 py-2 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
                onClick={() => open(value)}
                type="button"
              >
                Open celebration
              </button>
            </div>
            <CelebrationPreview view={example(value, '2026-10-27', `static-${value}`)} />
          </section>
        ))}
      </div>
      {active ? (
        <CelebrationHost
          celebrations={[active]}
          key={iteration}
          priority="page"
          timeZone="Asia/Kolkata"
        />
      ) : null}
    </main>
  )
}

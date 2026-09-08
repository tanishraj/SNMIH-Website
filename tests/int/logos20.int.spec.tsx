import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { Logos20BlockComponent } from '@/blocks/Logos20/Component'
import { Logos20Block } from '@/blocks/Logos20/config'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { Page } from '@/payload-types'

vi.mock('react-fast-marquee', () => ({
  default: ({
    children,
    direction,
    play,
    speed,
  }: {
    children: ReactNode
    direction: string
    play: boolean
    speed: number
  }) => (
    <div
      data-marquee-direction={direction}
      data-marquee-play={String(play)}
      data-marquee-speed={speed}
    >
      {children}
    </div>
  ),
}))
const row = [{ id: 'one', name: 'Northstar', image: { id: 'image', url: '/brand.svg' } }]
let reduced = false
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  reduced = false
})

describe('Logo Marquee', () => {
  it('has two initial rows, repeatable additional rows, and no split layout fields', () => {
    const tabs = Logos20Block.fields[0]
    if (tabs.type !== 'tabs') throw new Error('Expected tabs')
    expect(tabs.tabs.map((t) => t.label)).toEqual(['Content', 'Theme Settings'])
    const fields = tabs.tabs
      .flatMap((t) => t.fields)
      .filter((f) => 'name' in f)
      .map((f) => f.name)
    expect(fields).toContain('topRow')
    expect(fields).toContain('bottomRow')
    const additional = tabs.tabs
      .flatMap((t) => t.fields)
      .find((f) => 'name' in f && f.name === 'additionalRows')
    if (additional?.type !== 'array') throw new Error('Expected repeatable logo rows')
    expect(additional.maxRows).toBeUndefined()
    expect(additional.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'logos', type: 'array', maxRows: 40 }),
      ]),
    )
    expect(fields).not.toContain('layoutMode')
    expect(fields).not.toContain('splitProportion')
  })
  it('server-renders complete static rows before motion is initialized', () => {
    const html = renderToStaticMarkup(<Logos20BlockComponent topRow={row} />)
    expect(html).toContain('data-logos20-motion="static"')
    expect(html).toContain('alt="Northstar"')
    expect(html).not.toContain('data-logos20-row="right"')
  })
  it('omits incomplete rows and empty blocks', () => {
    expect(renderToStaticMarkup(<Logos20BlockComponent topRow={[{ name: 'Incomplete' }]} />)).toBe(
      '',
    )
    const html = renderToStaticMarkup(
      <Logos20BlockComponent topRow={[{ name: 'Incomplete' }]} bottomRow={row} />,
    )
    expect(html).toContain('data-logos20-row="right"')
    expect(html).not.toContain('data-logos20-row="left"')
  })
  it('runs the two rows in opposite directions and pauses both', () => {
    const { container } = render(
      <Logos20BlockComponent topRow={row} bottomRow={row} speed="fast" />,
    )
    expect(container.querySelectorAll('[data-marquee-direction]')).toHaveLength(2)
    expect(container.querySelector('[data-marquee-direction="left"]')).toBeTruthy()
    expect(container.querySelector('[data-marquee-direction="right"]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Pause logos' }))
    expect(container.querySelectorAll('[data-marquee-play="false"]')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Resume logos' }))
    expect(container.querySelectorAll('[data-marquee-play="true"]')).toHaveLength(2)
  })
  it('uses static logos when visitors prefer reduced motion', () => {
    reduced = true
    const { container } = render(<Logos20BlockComponent topRow={row} />)
    expect(container.querySelector('[data-marquee-direction]')).toBeNull()
    expect(screen.getByRole('img', { name: 'Northstar' })).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('renders additional rows in order with alternating directions and shared pause controls', () => {
    const additionalRows = ['Third', 'Fourth', 'Fifth'].map((name) => ({
      id: name,
      logos: [{ ...row[0], name }],
    }))
    const { container, rerender } = render(
      <Logos20BlockComponent topRow={row} bottomRow={row} additionalRows={additionalRows} />,
    )
    expect(
      [...container.querySelectorAll('[data-marquee-direction]')].map((el) =>
        el.getAttribute('data-marquee-direction'),
      ),
    ).toEqual(['left', 'right', 'left', 'right', 'left'])
    fireEvent.click(screen.getByRole('button', { name: 'Pause logos' }))
    expect(container.querySelectorAll('[data-marquee-play="false"]')).toHaveLength(5)
    rerender(
      <Logos20BlockComponent additionalRows={[...additionalRows].reverse()} enableMotion={false} />,
    )
    expect(screen.getAllByRole('img').map((el) => el.getAttribute('alt'))).toEqual([
      'Fifth',
      'Fourth',
      'Third',
    ])
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('supports additional rows alone, omits empty rows, and server-renders all valid logos', () => {
    const html = renderToStaticMarkup(
      <Logos20BlockComponent additionalRows={[{ logos: [] }, { logos: row }]} />,
    )
    expect(html).toContain('alt="Northstar"')
    expect(html.match(/data-logos20-row=/g)).toHaveLength(1)
    expect(html).toContain('data-logos20-motion="static"')
    expect(
      renderToStaticMarkup(
        <Logos20BlockComponent additionalRows={[{ logos: [{ name: 'Missing image' }] }]} />,
      ),
    ).toBe('')
  })
  it('can disable motion and preserve names when images fail', () => {
    render(<Logos20BlockComponent topRow={row} enableMotion={false} />)
    fireEvent.error(screen.getByRole('img', { name: 'Northstar' }))
    expect(screen.getByText('Northstar')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('registers in live preview and preserves header/footer actions', () => {
    const layout = [
      {
        blockType: 'logos20',
        topRow: row,
        additionalRows: [{ logos: [{ ...row[0], name: 'Additional partner' }] }],
        title: 'Partners',
        actions: [{ label: 'Section action', linkType: 'custom', url: '/section' }],
        footerActions: [{ label: 'Footer action', linkType: 'custom', url: '/footer' }],
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
      ),
    )
    expect(html).toContain('data-logos20="true"')
    expect(html).toContain('Section action')
    expect(html).toContain('Footer action')
    expect(html).toContain('Additional partner')
  })
})

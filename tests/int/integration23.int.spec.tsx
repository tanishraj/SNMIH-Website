import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { Integration23BlockComponent } from '@/blocks/Integration23/Component'
import { Integration23Block } from '@/blocks/Integration23/config'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { Page } from '@/payload-types'

const items = [
  { id: 'one', name: 'First Insurer', description: 'Contact the hospital for information.' },
  { id: 'two', name: 'Second Insurer' },
]

afterEach(cleanup)

describe('Partner Directory', () => {
  it('keeps stacked as the fallback and omits an empty split column', () => {
    const stacked = renderToStaticMarkup(
      <Integration23BlockComponent title="Partners" items={items} />,
    )
    expect(stacked).toContain('data-integration23-layout="stacked"')
    const noHeader = renderToStaticMarkup(
      <Integration23BlockComponent layoutMode="split" items={items} />,
    )
    expect(noHeader).toContain('data-integration23-layout="stacked"')
    expect(noHeader).not.toContain('data-integration23-content')
  })

  it.each(['left', 'center', 'right'] as const)(
    'keeps %s content alignment in split mode',
    (contentAlignment) => {
      const { container } = render(
        <Integration23BlockComponent
          layoutMode="split"
          gridPosition="left"
          sectionVerticalAlignment="bottom"
          contentAlignment={contentAlignment}
          title="Partners"
          items={items}
          actions={[{ label: 'Section action', linkType: 'custom', url: '/section' }]}
          footerActions={[{ label: 'Footer action', linkType: 'custom', url: '/footer' }]}
        />,
      )
      const content = container.querySelector('[data-integration23-content]')!
      const layout = container.querySelector('[data-integration23-layout]')!
      const footer = container.querySelector('[data-integration23-footer]')!
      expect(content.className).toContain(`text-${contentAlignment}`)
      expect(content.className).toContain('lg:self-end')
      expect(content.contains(screen.getByRole('link', { name: 'Section action' }))).toBe(true)
      expect(layout.contains(footer)).toBe(false)
      expect(footer.contains(screen.getByRole('link', { name: 'Footer action' }))).toBe(true)
      expect(content.className).toContain('max-w-3xl')
    },
  )

  it.each(['1', '2'] as const)('allows %s column choices in both layouts', (columns) => {
    for (const layoutMode of ['stacked', 'split'] as const) {
      const html = renderToStaticMarkup(
        <Integration23BlockComponent
          columns={columns}
          layoutMode={layoutMode}
          title="Partners"
          items={items}
        />,
      )
      expect(html).not.toContain('grid-cols-4')
      if (columns === '2')
        expect(html).toContain(layoutMode === 'split' ? '@sm:grid-cols-2' : 'sm:grid-cols-2')
    }
  })

  it.each(['inline', 'block'] as const)(
    'applies %s item layout to static tiles and dialog triggers',
    (itemLayout) => {
      const { container } = render(
        <Integration23BlockComponent itemLayout={itemLayout} items={items} />,
      )
      const cells = container.querySelectorAll('[data-integration23-item-layout]')
      expect(cells).toHaveLength(2)
      for (const cell of cells) {
        expect(cell.getAttribute('data-integration23-item-layout')).toBe(itemLayout)
        expect(cell.firstElementChild?.className).toContain(
          itemLayout === 'inline' ? 'flex-row' : 'flex-col',
        )
      }
      fireEvent.click(screen.getByRole('button', { name: 'First Insurer' }))
      expect(screen.getByRole('dialog').textContent).toContain('Contact the hospital')
    },
  )

  it('defaults to an equal split and retains block item presentation', () => {
    const { container } = render(
      <Integration23BlockComponent layoutMode="split" title="Partners" items={items} />,
    )
    expect(container.querySelector('[data-integration23-layout]')?.className).toContain(
      'lg:grid-cols-2',
    )
    expect(
      container
        .querySelector('[data-integration23-item-layout]')
        ?.getAttribute('data-integration23-item-layout'),
    ).toBe('block')
  })

  it.each(['left', 'center'] as const)('aligns both item layouts to the %s', (itemAlignment) => {
    for (const itemLayout of ['inline', 'block'] as const) {
      const html = renderToStaticMarkup(
        <Integration23BlockComponent
          itemAlignment={itemAlignment}
          itemLayout={itemLayout}
          items={items}
        />,
      )
      expect(html).toContain(`text-${itemAlignment}`)
      expect(html).toContain(
        itemLayout === 'inline'
          ? itemAlignment === 'left'
            ? 'justify-start'
            : 'justify-center'
          : itemAlignment === 'left'
            ? 'items-start'
            : 'items-center',
      )
    }
  })

  it('keeps horizontal and vertical dividers without an outer frame for ruled entries', () => {
    const { container } = render(<Integration23BlockComponent gridStyle="ruled" items={items} />)
    const grid = container.querySelector('[data-integration23-grid]')!
    expect(grid.classList.contains('border')).toBe(false)
    for (const item of grid.querySelectorAll('li')) {
      expect(item.classList.contains('border-r')).toBe(true)
      expect(item.classList.contains('border-b')).toBe(true)
    }
  })

  it('supports the full insurer list and optional logos in the CMS', () => {
    const tabs = Integration23Block.fields[0]
    if (tabs.type !== 'tabs') throw new Error('Expected Content / Theme Settings tabs')
    const rows = tabs.tabs[0].fields.find((field) => 'name' in field && field.name === 'items')
    expect(rows).toMatchObject({ type: 'array', minRows: 1, maxRows: 100 })
    if (rows?.type !== 'array') throw new Error('Expected array')
    expect(
      rows.fields.find((field) => 'name' in field && field.name === 'logo'),
    ).not.toHaveProperty('required', true)
  })

  it('omits blank draft rows, keeps duplicate names, and renders names without logos', () => {
    const html = renderToStaticMarkup(
      <Integration23BlockComponent
        items={[{ name: '  ' }, { name: ' First Insurer ' }, { name: 'First Insurer' }]}
      />,
    )
    expect(html.match(/<li\b/g)).toHaveLength(2)
    expect(html).toContain('FI')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<h2')
    expect(renderToStaticMarkup(<Integration23BlockComponent items={[{ name: '' }]} />)).toBe('')
  })

  it('opens details only for authored content and restores focus on Escape', async () => {
    render(<Integration23BlockComponent items={items} />)
    expect(screen.queryByRole('button', { name: 'Second Insurer' })).toBeNull()
    const trigger = screen.getByRole('button', { name: 'First Insurer' })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog').textContent).toContain(
      'Contact the hospital for information.',
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
  })

  it('keeps duplicate-name dialogs independent', () => {
    render(
      <Integration23BlockComponent
        items={[
          { name: 'Insurer', description: 'First details' },
          { name: 'Insurer', description: 'Second details' },
        ]}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Insurer' })[1])
    expect(screen.getByRole('dialog').textContent).toContain('Second details')
    expect(screen.getByRole('dialog').textContent).not.toContain('First details')
  })

  it('renders static entries when detail dialogs are disabled', () => {
    render(<Integration23BlockComponent enableDetails={false} items={items} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('uses shared action resolution for link-only dialogs and section actions', () => {
    render(
      <Integration23BlockComponent
        actions={[{ label: 'Contact', linkType: 'custom', url: '/contact' }]}
        items={[
          {
            name: 'Insurer',
            actions: [
              {
                label: 'Website',
                linkType: 'custom',
                url: 'https://example.com',
                openInNewTab: true,
              },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/contact')
    fireEvent.click(screen.getByRole('button', { name: 'Insurer' }))
    expect(screen.getByRole('link', { name: 'Website' }).getAttribute('target')).toBe('_blank')
    expect(screen.getByRole('dialog').getAttribute('aria-describedby')).toBeTruthy()
  })

  it('replaces failed logo images with initials', () => {
    const { container } = render(
      <Integration23BlockComponent
        items={[{ name: 'Missing Logo', logo: { id: 'logo', url: '/missing.svg' } }]}
      />,
    )
    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    fireEvent.error(image!)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('ML')).toBeTruthy()
  })

  it('renders through the live preview registry', () => {
    const layout = [{ blockType: 'integration23', title: 'Our insurers', items }] as NonNullable<
      Page['layout']
    >
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
    expect(html).toContain('data-integration23="true"')
    expect(html).toContain('Our insurers')
    expect(html).toContain('First Insurer')
  })
})

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DocumentChecklistBlockComponent } from '@/blocks/DocumentChecklist/Component'
import { DocumentChecklistBlock } from '@/blocks/DocumentChecklist/config'
import {
  formatChecklistMarker,
  getChecklistGridLayout,
  getChecklistStorageKey,
  normalizeChecklistItems,
  normalizeChecklistNotes,
  parseStoredChecklistKeys,
  toLowerRoman,
} from '@/blocks/DocumentChecklist/normalizeDocumentChecklist'

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
})

const items = [
  { id: 'a', label: 'Residential Certificate' },
  { id: 'b', label: '  ' },
  { id: 'c', label: ' DQ Certificate ', qualifier: ' If required ', details: 'As per para-7(B)' },
]

const collectFieldNames = (block: typeof DocumentChecklistBlock) => {
  const names: string[] = []
  const visit = (fields: unknown[]) => {
    for (const field of fields as Array<Record<string, unknown>>) {
      if (typeof field.name === 'string') names.push(field.name)
      if (Array.isArray(field.tabs)) {
        for (const tab of field.tabs as Array<{ fields: unknown[] }>) visit(tab.fields)
      }
    }
  }
  visit(block.fields)
  return names
}

describe('Document Checklist block', () => {
  it('registers a unique slug, interface name, and the shared section options', () => {
    expect(DocumentChecklistBlock.slug).toBe('documentChecklist')
    expect(DocumentChecklistBlock.interfaceName).toBe('DocumentChecklistBlock')
    expect(collectFieldNames(DocumentChecklistBlock)).toEqual(
      expect.arrayContaining([
        'eyebrow',
        'title',
        'accentTitle',
        'description',
        'actions',
        'footerActions',
        'appearance',
        'layoutMode',
        'splitProportion',
        'checklistPosition',
        'sectionVerticalAlignment',
        'contentAlignment',
        'sidebarBackground',
        'size',
      ]),
    )
  })

  it('formats lower Roman, decimal, and check markers', () => {
    expect([1, 4, 9, 14, 19, 20, 40].map(toLowerRoman)).toEqual([
      'i',
      'iv',
      'ix',
      'xiv',
      'xix',
      'xx',
      'xl',
    ])
    expect(formatChecklistMarker(2, 'lowerRoman')).toBe('iii.')
    expect(formatChecklistMarker(2, 'decimal')).toBe('3.')
    expect(formatChecklistMarker(2, 'check')).toBe('')
  })

  it('trims authored text, drops blank rows, and keys items by row id', () => {
    expect(normalizeChecklistItems(items)).toEqual([
      { details: undefined, key: 'a', label: 'Residential Certificate', qualifier: undefined },
      { details: 'As per para-7(B)', key: 'c', label: 'DQ Certificate', qualifier: 'If required' },
    ])
    expect(normalizeChecklistNotes([{ label: ' ', text: ' Merge files ' }, { text: '' }])).toEqual([
      { key: 'note-0', label: undefined, text: 'Merge files' },
    ])
  })

  it('keeps only stored keys that still match rendered items', () => {
    expect(getChecklistStorageKey(' block-1 ')).toBe('document-checklist:block-1')
    expect(getChecklistStorageKey(null)).toBeUndefined()
    expect(parseStoredChecklistKeys('["a","gone",3]', ['a', 'c'])).toEqual(['a'])
    expect(parseStoredChecklistKeys('not json', ['a'])).toEqual([])
  })

  it('renders a stacked tracker with progress, print, notes, and accent title', () => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        accentTitle="for verification"
        items={items}
        notes={[{ label: 'Note', text: 'Merge UDID card and affidavit into one PDF.' }]}
        title="Documents required"
      />,
    )

    expect(html).toContain('data-document-checklist-layout="stacked"')
    expect(html).toContain('data-document-checklist-tracking="true"')
    expect(html).toContain('data-document-checklist-columns="two"')
    expect(html).toContain('<span class="italic">for verification</span>')
    expect(html).toContain('of 2 ready')
    expect(html).toContain('Print checklist')
    expect(html).toContain('1 conditional')
    expect(html).toContain('data-card-background="primary"')
    expect(html).toContain('data-document-checklist-note="true"')
  })

  it('renders split layouts beside the checklist and a static list when tracking is off', () => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        checklistPosition="left"
        enableTracking={false}
        items={items}
        layoutMode="split"
        showPrintButton={false}
        title="Documents required"
      />,
    )

    expect(html).toContain('data-document-checklist-layout="split"')
    expect(html).toContain('lg:col-start-2')
    expect(html).toContain('data-document-checklist-tracking="false"')
    expect(html).toContain('data-document-checklist-columns="two"')
    expect(html).not.toContain('role="checkbox"')
    expect(html).not.toContain('data-document-checklist-sidebar')
  })

  it('lets visitors tick documents, persists ticks per block, and clears them', async () => {
    const { unmount } = render(
      <DocumentChecklistBlockComponent id="block-1" items={items} title="Documents required" />,
    )

    const [first] = screen.getAllByRole('checkbox')
    await act(async () => {
      fireEvent.click(first!)
    })

    expect(screen.getByText('1', { selector: 'span' })).toBeTruthy()
    expect(window.localStorage.getItem('document-checklist:block-1')).toBe('["a"]')

    unmount()
    render(
      <DocumentChecklistBlockComponent id="block-1" items={items} title="Documents required" />,
    )
    expect(await screen.findByRole('checkbox', { checked: true })).toBeTruthy()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /clear ticks/i }))
    })
    expect(window.localStorage.getItem('document-checklist:block-1')).toBeNull()
  })

  it('lays out one, two, or three aligned columns in reading order', () => {
    const one = getChecklistGridLayout(7, 'one')
    expect(one.usesTwo).toBe(false)
    expect(one.container).toBe('grid grid-cols-1')

    const three = getChecklistGridLayout(7, 'three')
    expect(three.container).toContain('@xl:grid-cols-2')
    expect(three.container).toContain('@3xl:grid-cols-3')
    expect(three.style).toEqual({ '--checklist-rows-2': '4', '--checklist-rows-3': '3' })
    // Item 3 ends column one at two columns (rows of 4) and starts column two at three columns.
    expect(three.item(3)).toContain('@xl:border-b-0')
    expect(three.item(3)).toContain('@3xl:border-l')
    expect(three.item(6)).toContain('border-b-0')
    expect(getChecklistGridLayout(2, 'three').usesThree).toBe(false)
  })

  it.each(['split', 'stacked'] as const)('honours three columns in the %s layout', (layoutMode) => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        columns="three"
        items={[...items, { id: 'd', label: 'Aadhar Card' }]}
        layoutMode={layoutMode}
        title="Documents"
      />,
    )

    expect(html).toContain(`data-document-checklist-layout="${layoutMode}"`)
    expect(html).toContain('data-document-checklist-columns="three"')
  })

  it('moves progress, print, and notes out of the panel when it is hidden', () => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        items={items}
        notes={[{ label: 'Note', text: 'Merge files.' }]}
        showProgressPanel={false}
        title="Documents"
      />,
    )

    expect(html).not.toContain('data-document-checklist-sidebar')
    expect(html).toContain('0 of 2 ready')
    expect(html).toContain('Print')
    expect(html).toContain('data-document-checklist-notes="true"')
  })

  it('renders the Editorial Ledger presentation without card chrome', () => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        columns="three"
        enableTracking={false}
        items={[...items, { id: 'd', label: 'Aadhar Card' }]}
        notes={[{ label: 'Note', text: 'Merge files.' }]}
        presentation="ledger"
        showPrintButton={false}
        showProgressPanel={false}
        title="Documents"
      />,
    )

    expect(html).toContain('data-document-checklist-presentation="ledger"')
    expect(html).toContain('data-document-checklist-columns="three"')
    expect(html).not.toContain('rounded-card border border-border bg-card')
    expect(html).not.toContain('role="checkbox"')
    expect(html).toContain('<strong class="font-semibold text-current">Note. </strong>')
  })

  it('gives each ledger column its own top and closing rules', () => {
    const grid = getChecklistGridLayout(5, 'two')
    expect(grid.ledgerItem(0)).toContain('border-t')
    expect(grid.ledgerItem(2)).toContain('@xl:border-b')
    expect(grid.ledgerItem(4)).toContain('border-b')
  })

  it('offers a plain Top alignment alongside the sticky one', () => {
    const render = (sectionVerticalAlignment: 'top' | 'topStatic') =>
      renderToStaticMarkup(
        <DocumentChecklistBlockComponent
          items={items}
          layoutMode="split"
          sectionVerticalAlignment={sectionVerticalAlignment}
          title="Documents"
        />,
      )

    expect(render('top')).toContain('lg:sticky lg:top-24 lg:self-start')
    expect(render('topStatic')).not.toContain('lg:sticky')
    expect(render('topStatic')).toContain('lg:self-start')
  })

  it('can place section actions at the bottom of the layout', () => {
    const action = {
      label: 'Download prospectus',
      linkType: 'custom' as const,
      url: 'https://example.edu/prospectus.pdf',
    }
    const render = (
      actionsPosition: 'intro' | 'bottom',
      layoutMode: 'split' | 'stacked' = 'split',
    ) =>
      renderToStaticMarkup(
        <DocumentChecklistBlockComponent
          actions={[action]}
          actionsPosition={actionsPosition}
          items={items}
          layoutMode={layoutMode}
          title="Documents"
        />,
      )

    const intro = render('intro')
    expect(intro).toContain('data-document-checklist-actions="intro"')
    expect(intro.indexOf('Download prospectus')).toBeLessThan(intro.indexOf('<ol'))

    // Split: once at the foot of the intro column (large screens), once after the list (small screens).
    const split = render('bottom')
    expect(split).toContain('data-document-checklist-intro-bottom="true"')
    expect(split).toContain('lg:self-stretch')
    expect(split.split('Download prospectus')).toHaveLength(3)
    expect(split.lastIndexOf('Download prospectus')).toBeGreaterThan(split.indexOf('</ol>'))

    const stacked = render('bottom', 'stacked')
    expect(stacked).not.toContain('data-document-checklist-intro-bottom')
    expect(stacked.split('Download prospectus')).toHaveLength(2)
    expect(stacked.indexOf('Download prospectus')).toBeGreaterThan(stacked.indexOf('</ol>'))
  })

  it.each([
    ['center', 'mx-auto items-center text-center'],
    ['right', 'ml-auto items-end text-right'],
  ] as const)('positions the %s-aligned introduction itself', (contentAlignment, classes) => {
    const html = renderToStaticMarkup(
      <DocumentChecklistBlockComponent
        contentAlignment={contentAlignment}
        items={items}
        title="Documents"
      />,
    )

    expect(html).toContain(classes)
  })

  it('renders nothing without a heading or a valid item', () => {
    expect(renderToStaticMarkup(<DocumentChecklistBlockComponent items={items} />)).toBe('')
    expect(
      renderToStaticMarkup(
        <DocumentChecklistBlockComponent items={[{ label: ' ' }]} title="Documents" />,
      ),
    ).toBe('')
  })
})

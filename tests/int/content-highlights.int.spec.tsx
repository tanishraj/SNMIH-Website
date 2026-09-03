import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ContentHighlightsBlockComponent } from '@/blocks/ContentHighlights/Component'
import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'
import { ContentHighlights } from '@/components/content-highlights'

import { getGeneratedPayloadInterface } from './helpers/generatedPayloadInterface'

type TestField = {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
    hidden?: boolean
  }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  tabs?: TestTab[]
  type?: string
}

type TestTab = { fields: TestField[]; label: string }

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const item = (title: string) => ({ markerMode: 'numbered' as const, title })

describe('Content Highlights', () => {
  it('defines the aligned Payload schema', () => {
    expect(ContentHighlightsBlock).toMatchObject({
      interfaceName: 'ContentHighlightsBlock',
      labels: { plural: 'Content Highlights', singular: 'Content Highlights' },
      slug: 'contentHighlights',
    })

    const tabs = ContentHighlightsBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const content = tabs.tabs.find(({ label }) => label === 'Content')
    const theme = tabs.tabs.find(({ label }) => label === 'Theme Settings')
    const items = getField(content?.fields ?? [], 'items')

    expect(tabs.type).toBe('tabs')
    expect(content?.fields.map(({ name }) => name)).toEqual([
      'eyebrow',
      'title',
      'accentTitle',
      'description',
      'actions',
      'footerActions',
      'items',
    ])
    expect(getField(content?.fields ?? [], 'title')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(items).toMatchObject({ maxRows: 6, minRows: 1, required: true, type: 'array' })

    const itemTabs = items?.fields?.[0]
    const itemContent = itemTabs?.tabs?.find(({ label }) => label === 'Content')
    const itemTheme = itemTabs?.tabs?.find(({ label }) => label === 'Theme Settings')

    expect(itemContent?.fields.map(({ name }) => name)).toEqual([
      'markerMode',
      'markerLabel',
      'metadata',
      'title',
      'description',
      'cardAction',
    ])
    expect(getField(itemContent?.fields ?? [], 'markerMode')).toMatchObject({
      defaultValue: 'numbered',
      label: 'Card Eyebrow',
      required: true,
      type: 'select',
    })
    expect(getField(itemContent?.fields ?? [], 'markerMode')?.options).toEqual([
      { label: 'Numbered', value: 'numbered' },
      { label: 'Custom Text', value: 'custom' },
      { label: 'Hidden', value: 'hidden' },
    ])
    const markerLabel = getField(itemContent?.fields ?? [], 'markerLabel')
    expect(markerLabel?.label).toBe('Custom Eyebrow')
    expect(markerLabel?.admin?.condition).toBeTypeOf('function')
    expect(markerLabel?.admin?.condition?.({}, { markerMode: 'custom' })).toBe(true)
    expect(markerLabel?.admin?.condition?.({}, { markerMode: 'numbered' })).toBe(false)
    expect(getField(itemContent?.fields ?? [], 'title')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(getField(itemContent?.fields ?? [], 'metadata')).toMatchObject({
      label: 'Metadata',
      type: 'text',
    })
    expect(getField(itemContent?.fields ?? [], 'cardAction')).toMatchObject({
      maxRows: 1,
      type: 'array',
    })
    expect(itemTheme?.fields.map(({ name }) => name)).toEqual(['cardBackground'])

    for (const removedField of ['linkType', 'page', 'url', 'openInNewTab']) {
      expect(getField(itemContent?.fields ?? [], removedField)).toBeUndefined()
    }

    expect(theme?.fields.map(({ name }) => name)).toEqual([
      'appearance',
      'itemsLayout',
      'cardStyle',
      'eyebrowPlacement',
      'cardLayout',
      'gridColumns',
      'layout',
      'itemTreatment',
      'ruledDividers',
      'headerLayout',
      'contentAlignment',
      'splitContentAlignment',
      'size',
    ])
    expect(getField(theme?.fields ?? [], 'itemsLayout')).toMatchObject({
      defaultValue: '3',
      label: 'Items Layout',
      options: [
        { label: '1 Column', value: '1' },
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'cardStyle')).toMatchObject({
      defaultValue: 'open',
      label: 'Card Style',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Left Rule', value: 'leftRule' },
        { label: 'Boxed', value: 'boxed' },
        { label: 'Rule', value: 'divided' },
      ],
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'cardLayout')).toMatchObject({
      defaultValue: 'grid',
      label: 'Card Layout',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
      ],
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'cardLayout')?.admin?.hidden).toBe(true)
    expect(getField(theme?.fields ?? [], 'gridColumns')).toMatchObject({
      defaultValue: '3',
      label: 'Grid Columns',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
      ],
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'gridColumns')?.admin?.hidden).toBe(true)
    expect(getField(theme?.fields ?? [], 'eyebrowPlacement')).toMatchObject({
      defaultValue: 'stacked',
      label: 'Eyebrow Placement',
      options: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Inline', value: 'inline' },
      ],
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'layout')?.options).toEqual([
      { label: 'Editorial List', value: 'editorialRow' },
      { label: 'Calm Grid', value: 'highlightsGrid' },
      { label: 'Simple Grid', value: 'simpleGrid' },
    ])
    expect(getField(theme?.fields ?? [], 'layout')?.admin?.hidden).toBe(true)
    expect(getField(theme?.fields ?? [], 'itemTreatment')).toMatchObject({
      defaultValue: 'auto',
      label: 'Item Treatment',
      required: true,
      type: 'select',
    })
    expect(getField(theme?.fields ?? [], 'itemTreatment')?.options).toEqual([
      { label: 'Automatic', value: 'auto' },
      { label: 'Open', value: 'open' },
      { label: 'Ruled', value: 'ruled' },
      { label: 'Boxed', value: 'boxed' },
    ])
    expect(getField(theme?.fields ?? [], 'itemTreatment')?.admin?.hidden).toBe(true)
    const ruledDividers = getField(theme?.fields ?? [], 'ruledDividers')
    expect(ruledDividers).toMatchObject({
      defaultValue: 'rows',
      label: 'Ruled Dividers',
      required: true,
      type: 'select',
    })
    expect(ruledDividers?.options).toEqual([
      { label: 'Rows Only', value: 'rows' },
      { label: 'Full Grid', value: 'grid' },
      { label: 'Individual Items', value: 'individual' },
    ])
    expect(ruledDividers?.admin?.hidden).toBe(true)
    expect(ruledDividers?.admin?.condition?.({}, { itemTreatment: 'ruled' })).toBe(true)
    expect(
      ruledDividers?.admin?.condition?.({}, { itemTreatment: 'auto', layout: 'editorialRow' }),
    ).toBe(true)
    expect(
      ruledDividers?.admin?.condition?.({}, { itemTreatment: 'auto', layout: 'highlightsGrid' }),
    ).toBe(false)
    expect(ruledDividers?.admin?.condition?.({}, { itemTreatment: 'boxed' })).toBe(false)
    expect(getField(theme?.fields ?? [], 'simpleGridColumnDivider')).toBeUndefined()
    expect(getField(theme?.fields ?? [], 'headerLayout')).toMatchObject({
      defaultValue: 'stacked',
      required: true,
      type: 'select',
    })
    expect(
      getField(theme?.fields ?? [], 'headerLayout')?.options?.map(({ value }) => value),
    ).toEqual(['stacked', 'split'])
    expect(getField(theme?.fields ?? [], 'enableSplitLayout')).toBeUndefined()

    const horizontal = getField(theme?.fields ?? [], 'contentAlignment')
    const vertical = getField(theme?.fields ?? [], 'splitContentAlignment')
    expect(horizontal).toMatchObject({ defaultValue: 'left', type: 'select' })
    expect(horizontal?.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(true)
    expect(horizontal?.admin?.condition?.({}, { headerLayout: 'split' })).toBe(false)
    expect(vertical).toMatchObject({ defaultValue: 'top', type: 'select' })
    expect(vertical?.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)
    expect(vertical?.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
    expect(getField(theme?.fields ?? [], 'size')?.defaultValue).toBe('default')
  })

  it('renders explicit cleaned presentation controls', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        cardLayout="list"
        cardStyle="leftRule"
        eyebrowPlacement="inline"
        gridColumns="2"
        items={[item('First')]}
        itemsLayout="4"
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlights-items-layout="4"')
    expect(html).toContain('data-content-highlights-card-layout="grid"')
    expect(html).toContain('data-content-highlights-card-style="leftRule"')
    expect(html).toContain('data-content-highlights-grid-columns="4"')
    expect(html).toContain('data-content-highlights-eyebrow-placement="inline"')
  })

  it.each([
    ['editorialRow', undefined, undefined, '1', 'grid', 'divided', '1', 'stacked'],
    ['highlightsGrid', undefined, undefined, '3', 'grid', 'boxed', '3', 'stacked'],
    ['simpleGrid', undefined, undefined, '2', 'grid', 'open', '2', 'inline'],
    ['numberedSteps', undefined, undefined, '3', 'grid', 'boxed', '3', 'stacked'],
    ['highlightsGrid', 'ruled', 'individual', '3', 'grid', 'leftRule', '3', 'stacked'],
    ['highlightsGrid', 'ruled', 'grid', '3', 'grid', 'divided', '3', 'stacked'],
  ] as const)(
    'normalizes legacy %s/%s/%s presentation values',
    (
      layout,
      itemTreatment,
      ruledDividers,
      expectedItemsLayout,
      expectedLayout,
      expectedStyle,
      expectedColumns,
      expectedEyebrowPlacement,
    ) => {
      const html = renderToStaticMarkup(
        <ContentHighlightsBlockComponent
          itemTreatment={itemTreatment}
          items={[item('First')]}
          layout={layout}
          ruledDividers={ruledDividers}
          title="Highlights"
        />,
      )

      expect(html).toContain(`data-content-highlights-items-layout="${expectedItemsLayout}"`)
      expect(html).toContain(`data-content-highlights-card-layout="${expectedLayout}"`)
      expect(html).toContain(`data-content-highlights-card-style="${expectedStyle}"`)
      expect(html).toContain(`data-content-highlights-grid-columns="${expectedColumns}"`)
      expect(html).toContain(
        `data-content-highlights-eyebrow-placement="${expectedEyebrowPlacement}"`,
      )
    },
  )

  it('normalizes a stale List selection to 1 Column', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[item('First')]}
        itemsLayout={'list' as never}
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlights-items-layout="1"')
    expect(html).toContain('data-content-highlights-grid-columns="1"')
  })

  it('renders the complete card hierarchy with an inline eyebrow', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        cardLayout="list"
        cardStyle="open"
        eyebrowPlacement="inline"
        items={[
          {
            cardAction: [{ label: 'Read', linkType: 'custom', url: '/read' }],
            description: 'A concise supporting description.',
            markerLabel: 'Clinical',
            markerMode: 'custom',
            metadata: '15/07/2026',
            title: 'Precision cardiology',
          },
        ]}
        title="Highlights"
      />,
    )
    const eyebrowIndex = html.indexOf('Clinical')
    const metadataIndex = html.indexOf('15/07/2026')
    const titleIndex = html.indexOf('Precision cardiology')
    const descriptionIndex = html.indexOf('A concise supporting description.')
    const actionIndex = html.indexOf('Read')

    expect(html).toContain('data-content-highlight-eyebrow-placement="inline"')
    expect(html).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(html).toContain('data-content-highlight-metadata="true"')
    expect(html).toContain('data-content-highlight-inline-content="true"')
    expect(eyebrowIndex).toBeGreaterThan(-1)
    expect(metadataIndex).toBeGreaterThan(eyebrowIndex)
    expect(titleIndex).toBeGreaterThan(metadataIndex)
    expect(descriptionIndex).toBeGreaterThan(titleIndex)
    expect(actionIndex).toBeGreaterThan(descriptionIndex)
  })

  it('does not reserve an inline eyebrow rail when the eyebrow is hidden', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        cardLayout="list"
        cardStyle="open"
        eyebrowPlacement="inline"
        items={[{ markerMode: 'hidden', metadata: 'Current', title: 'No eyebrow' }]}
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlight-eyebrow-placement="inline"')
    expect(html).toContain('data-content-highlight-metadata="true"')
    expect(html).not.toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(html).not.toContain('data-content-highlight-marker')
  })

  it('omits blank metadata without reserving space', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[{ markerMode: 'numbered', metadata: '   ', title: 'No metadata' }]}
        title="Highlights"
      />,
    )

    expect(html).not.toContain('data-content-highlight-metadata')
  })

  it.each([
    ['1', 'grid grid-cols-1 gap-x-6 gap-y-8'],
    ['2', 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2'],
    ['3', 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3'],
    ['4', 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4'],
  ] as const)('renders the %s Items Layout geometry', (itemsLayout, expectedClasses) => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="open"
        items={[item('One'), item('Two'), item('Three'), item('Four')]}
        itemsLayout={itemsLayout}
        title="Highlights"
      />,
    )

    expect(html).toContain(`data-content-highlights-items-layout="${itemsLayout}"`)
    expect(html).toContain(expectedClasses)
  })

  describe.each(['1', '2', '3', '4'] as const)('%s Items Layout', (itemsLayout) => {
    it.each(['open', 'leftRule', 'boxed', 'divided'] as const)(
      'renders the %s card style',
      (cardStyle) => {
        const html = renderToStaticMarkup(
          <ContentHighlights
            cardStyle={cardStyle}
            items={[item('One'), item('Two'), item('Three'), item('Four')]}
            itemsLayout={itemsLayout}
            title="Highlights"
          />,
        )
        const articleTags = html.match(/<article class="[^"]*"[^>]*>/g) ?? []

        expect(html).toContain(`data-content-highlights-items-layout="${itemsLayout}"`)
        expect(html).toContain(`data-content-highlights-card-style="${cardStyle}"`)
        expect(articleTags).toHaveLength(4)
        expect(
          articleTags.every((tag) => tag.includes(`data-content-highlight-style="${cardStyle}"`)),
        ).toBe(true)

        if (cardStyle === 'open') {
          expect(articleTags.every((tag) => !tag.includes('border'))).toBe(true)
        } else if (cardStyle === 'leftRule') {
          expect(articleTags.every((tag) => tag.includes('border-l-2'))).toBe(true)
        } else if (cardStyle === 'boxed') {
          expect(
            articleTags.every((tag) => tag.includes('rounded-card border p-6 md:p-7')),
          ).toBe(true)
        } else {
          expect(
            articleTags.every((tag) =>
              tag.includes('border-b px-6 py-8 md:px-7 md:py-10'),
            ),
          ).toBe(true)
          expect(html).toContain('[&amp;&gt;*:first-child]:border-t')

          if (itemsLayout === '1') {
            expect(html).not.toContain('nth-child(2n)]:border-l')
          } else {
            expect(html).toContain('md:[&amp;&gt;*:nth-child(2n)]:border-l')
          }

          if (itemsLayout === '3') {
            expect(html).toContain('lg:[&amp;&gt;*:nth-child(3n+1)]:border-l-0')
          }

          if (itemsLayout === '4') {
            expect(html).toContain('xl:[&amp;&gt;*:nth-child(4n+1)]:border-l-0')
            expect(html).toContain('xl:[&amp;&gt;*:nth-child(4n+3)]:border-l')
          }
        }
      },
    )
  })

  it('insets Rule cards on the inherited surface', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="divided"
        items={[item('One'), item('Two')]}
        itemsLayout="1"
        title="Highlights"
      />,
    )
    const articleTags = html.match(/<article class="[^"]*"[^>]*>/g) ?? []

    expect(articleTags).toHaveLength(2)
    expect(
      articleTags.every((tag) =>
        tag.includes('border-b px-6 py-8 md:px-7 md:py-10'),
      ),
    ).toBe(true)
  })

  it('keeps Rule cards padded when they use an explicit surface', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="divided"
        items={[{ ...item('One'), cardBackground: 'primary' }]}
        itemsLayout="1"
        title="Highlights"
      />,
    )
    const articleTag = html.match(/<article class="[^"]*"[^>]*>/)?.[0]

    expect(articleTag).toContain('border-b px-6 py-8 md:px-7 md:py-10')
  })

  it('uses a wider inline eyebrow rail for the one-column Rule layout', () => {
    const oneColumn = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="divided"
        eyebrowPlacement="inline"
        items={[item('One')]}
        itemsLayout="1"
        title="Highlights"
      />,
    )
    const threeColumns = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="divided"
        eyebrowPlacement="inline"
        items={[item('One'), item('Two'), item('Three')]}
        itemsLayout="3"
        title="Highlights"
      />,
    )

    expect(oneColumn).toContain('md:grid-cols-[8rem_minmax(0,1fr)]')
    expect(threeColumns).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(threeColumns).not.toContain('md:grid-cols-[8rem_minmax(0,1fr)]')
  })

  it('honors four columns beside a Split header', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        cardStyle="open"
        headerLayout="split"
        items={[item('One'), item('Two'), item('Three')]}
        itemsLayout="4"
        title="Highlights"
      />,
    )

    expect(html).toContain('md:grid-cols-2')
    expect(html).toContain('xl:grid-cols-4')
  })

  it('renders a 2px left rule for each Individual Item', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        itemTreatment="ruled"
        items={[item('One'), item('Two'), item('Three'), item('Four')]}
        layout="highlightsGrid"
        ruledDividers="individual"
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlights-ruled-dividers="individual"')
    expect(html).toContain('grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3')
    expect(html.match(/class="flex min-w-0 flex-col border-l-2 p-6 md:p-7/g)).toHaveLength(4)
    expect(html).not.toContain('[&amp;&gt;*:first-child]:border-t')
    expect(html).not.toContain('nth-child(2n)]:border-l')
    expect(html).not.toContain('class="overflow-hidden" data-content-highlights-items="true"')
  })

  it('insets every Rule card in a Split two-column grid', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        headerLayout="split"
        items={[item('One'), item('Two'), item('Three'), item('Four')]}
        itemsLayout="2"
        itemTreatment="ruled"
        ruledDividers="grid"
        title="Highlights"
      />,
    )
    const articleClasses = [
      ...html.matchAll(/<article class="([^"]*)"[^>]*data-content-highlight-item="true"/g),
    ].map((match) => match[1] ?? '')

    expect(html).toContain('data-content-highlights-header-layout="split"')
    expect(html).toContain('data-content-highlights-items-layout="2"')
    expect(html).toContain('data-content-highlights-ruled-dividers="grid"')
    expect(html).toContain('md:[&amp;&gt;*:nth-child(2n)]:border-l')
    expect(articleClasses).toHaveLength(4)

    for (const className of articleClasses) {
      expect(className).toContain('border-b px-6 py-8 md:px-7 md:py-10')
    }
  })

  it('keeps explicit card backgrounds padded without forcing a border in Open mode', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        itemTreatment="open"
        items={[{ ...item('First'), cardBackground: 'primary' }]}
        title="Highlights"
      />,
    )
    const articleTag = html.match(/<article class="[^"]*"[^>]*>/)?.[0]

    expect(articleTag).toContain('p-6 md:p-7 bg-primary text-primary-foreground')
    expect(articleTag).not.toContain(' border ')
    expect(articleTag).not.toContain('border-t')
  })

  it('supports Stacked and Split header compositions', () => {
    const stacked = renderToStaticMarkup(
      <ContentHighlights
        contentAlignment="right"
        headerLayout="stacked"
        items={[item('First'), item('Second')]}
        title="Highlights"
      />,
    )
    const split = renderToStaticMarkup(
      <ContentHighlights
        headerLayout="split"
        items={[item('First'), item('Second')]}
        splitContentAlignment="bottom"
        title="Highlights"
      />,
    )

    expect(stacked).toContain('data-content-highlights-header-layout="stacked"')
    expect(stacked).toContain('ml-auto items-end text-right')
    expect(split).toContain('data-content-highlights-header-layout="split"')
    expect(split).toContain('lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')
    expect(split).toContain('lg:self-end')
    expect(split).toContain('lg:grid-cols-3')
  })

  it('normalizes per-card markers after unusable rows are removed', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[
          { markerMode: 'numbered', title: 'First usable card' },
          { markerMode: 'numbered', title: '   ' },
          { markerLabel: 'Clinical', markerMode: 'custom', title: 'Custom marker' },
          { markerMode: 'hidden', title: 'No marker' },
          { markerLabel: '   ', markerMode: 'custom', title: 'Blank custom marker' },
          { markerMode: 'stale' as never, title: 'Safe default' },
        ]}
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlight-marker="01"')
    expect(html).toContain('data-content-highlight-marker="Clinical"')
    expect(html).toContain('data-content-highlight-marker="05"')
    expect(html).not.toContain('data-content-highlight-marker="02"')
    expect(html).not.toContain('data-content-highlight-marker="03"')
    expect(html).not.toContain('data-content-highlight-marker=""')
    expect(html).not.toContain('data-content-highlight-metadata')
  })

  it('matches card marker colors to the shared eyebrow surface contract', () => {
    const html = renderToStaticMarkup(
      <ContentHighlights
        appearance={{ background: 'subtle' }}
        eyebrow="Latest"
        items={[
          item('Inherited surface'),
          {
            cardBackground: 'primary',
            markerLabel: 'Care',
            markerMode: 'custom',
            title: 'Explicit surface',
          },
        ]}
        title="Highlights"
      />,
    )
    const markerTags = html.match(/<p class="[^"]*" data-content-highlight-marker[^>]*>/g) ?? []

    expect(html).toContain('data-section-eyebrow-surface="subtle"')
    expect(markerTags).toHaveLength(2)
    expect(markerTags[0]).toContain(
      'font-mono text-xs font-medium tracking-[0.14em] text-current',
    )
    expect(markerTags[0]).not.toContain('font-semibold')
    expect(markerTags[0]).not.toContain('uppercase')
    expect(markerTags[0]).not.toContain('tracking-[0.18em]')
    expect(markerTags[0]).not.toContain('text-current/70')
    expect(markerTags[0]).toContain('data-section-eyebrow-surface="subtle"')
    expect(markerTags[1]).toContain(
      'font-mono text-xs font-medium tracking-[0.14em] text-current',
    )
    expect(markerTags[1]).toContain('data-section-eyebrow-surface="primary"')
  })

  it('renders metadata and one explicit card action while ignoring legacy title-link fields', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[
          {
            cardAction: [
              {
                label: 'Explore programme',
                linkType: 'custom',
                mode: 'button',
                openInNewTab: true,
                showArrow: true,
                url: '/programmes',
                variant: 'default',
              },
            ],
            cardBackground: 'primary',
            linkType: 'custom',
            metadata: 'Discard me',
            title: 'Clinical learning',
            url: '/legacy-title-link',
          } as never,
          {
            cardAction: [{ label: 'Broken action', linkType: 'custom', url: '' }],
            title: 'No empty footer',
          },
        ]}
        title="Highlights"
      />,
    )

    expect(html).toContain('data-content-highlight-action-footer="true"')
    expect(html).toContain('border-t')
    expect(html).toContain('mt-auto')
    expect(html).toContain('href="/programmes"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
    expect(html).toContain('data-action-arrow="true"')
    expect(html).toContain('bg-primary-foreground text-primary')
    expect(html).toContain('data-content-highlight-metadata="true"')
    expect(html).toContain('Discard me')
    expect(html).not.toContain('/legacy-title-link')
    expect(html.match(/data-content-highlight-action-footer="true"/g)).toHaveLength(1)
  })

  it.each([
    ['editorialRow', 'editorialRow'],
    ['highlightsGrid', 'highlightsGrid'],
    ['simpleGrid', 'simpleGrid'],
    ['numberedSteps', 'highlightsGrid'],
    ['stale', 'highlightsGrid'],
  ] as const)('normalizes %s to %s', (layout, expected) => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[{ title: 'Item' }]}
        layout={layout as never}
        title="Highlights"
      />,
    )
    expect(html).toContain(`data-content-highlights-layout="${expected}"`)
  })

  it('uses legacy split data only when Header Layout is absent', () => {
    const legacy = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        enableSplitLayout
        items={[{ title: 'Item' }]}
        title="Legacy split"
      />,
    )
    const explicit = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        enableSplitLayout
        headerLayout="stacked"
        items={[{ title: 'Item' }]}
        title="Explicit stacked"
      />,
    )
    expect(legacy).toContain('data-content-highlights-header-layout="split"')
    expect(explicit).toContain('data-content-highlights-header-layout="stacked"')
  })

  it('keeps section and footer actions independent from card actions', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        actions={[{ label: 'Explore all', linkType: 'custom', url: '/explore' }]}
        footerActions={[{ label: 'Contact us', linkType: 'custom', url: '/contact' }]}
        items={[item('Static card')]}
        title="Useful links"
      />,
    )

    expect(html).toContain('data-content-highlights-actions="true"')
    expect(html).toContain('href="/explore"')
    expect(html).toContain('href="/contact"')
    expect(html).not.toContain('data-content-highlight-action-footer="true"')
  })

  it('renders the editor-authored accent title', () => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        accentTitle="worth exploring."
        items={[item('Research')]}
        title="Content"
      />,
    )

    expect(html).toContain('<span class="block font-[inherit]">Content</span>')
    expect(html).toContain('<em class="block font-[inherit]">worth exploring.</em>')
  })

  it('renders nothing when required display content is unusable', () => {
    expect(ContentHighlightsBlockComponent({ items: [item('Item')], title: '   ' })).toBeNull()
    expect(
      ContentHighlightsBlockComponent({
        items: [{ markerMode: 'numbered', title: '   ' }],
        title: 'Valid title',
      }),
    ).toBeNull()
  })

  it('uses the current generated Payload contract', () => {
    const generatedTypes = readFileSync('src/payload-types.ts', 'utf8')
    const contentHighlightsType = getGeneratedPayloadInterface(
      generatedTypes,
      'ContentHighlightsBlock',
    )

    expect(contentHighlightsType).toContain("markerMode: 'numbered' | 'custom' | 'hidden'")
    expect(contentHighlightsType).toContain('markerLabel?: string | null')
    expect(contentHighlightsType).toContain('metadata?: string | null')
    expect(contentHighlightsType).toContain('cardAction?:')
    expect(contentHighlightsType).toContain("itemsLayout: '1' | '2' | '3' | '4'")
    expect(contentHighlightsType).toContain("cardLayout: 'grid' | 'list'")
    expect(contentHighlightsType).toContain("cardStyle: 'open' | 'leftRule' | 'boxed' | 'divided'")
    expect(contentHighlightsType).toContain("gridColumns: '2' | '3'")
    expect(contentHighlightsType).toContain("eyebrowPlacement: 'stacked' | 'inline'")
    expect(contentHighlightsType).toContain(
      "layout: 'editorialRow' | 'highlightsGrid' | 'simpleGrid'",
    )
    expect(contentHighlightsType).toContain("itemTreatment: 'auto' | 'open' | 'ruled' | 'boxed'")
    expect(contentHighlightsType).toContain(
      "ruledDividers?: ('rows' | 'grid' | 'individual') | null",
    )
    expect(contentHighlightsType).not.toContain('simpleGridColumnDivider')
    expect(contentHighlightsType).toContain("headerLayout: 'stacked' | 'split'")
    expect(contentHighlightsType).not.toContain("linkType: 'none' | 'page' | 'custom'")
    expect(contentHighlightsType).not.toContain('enableSplitLayout')
    expect(contentHighlightsType).not.toContain('numberedSteps')
  })
})

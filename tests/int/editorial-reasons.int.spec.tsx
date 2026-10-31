import { readFileSync } from 'node:fs'

import type { ArrayField, CheckboxField, Field, SelectField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { EditorialReasonsBlockComponent } from '@/blocks/EditorialReasons/Component'
import { EditorialReasonsBlock } from '@/blocks/EditorialReasons/config'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
import type { Page } from '@/payload-types'

const pageRendererSource = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
const livePreviewRendererSource = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')
const payloadTypesSource = readFileSync('src/payload-types.ts', 'utf8')
const thumbnailDefinitionsSource = readFileSync('src/block-thumbnails/definitions.ts', 'utf8')
const thumbnailFixturesSource = readFileSync('src/block-thumbnails/fixtures.tsx', 'utf8')
const featureInventorySource = readFileSync('docs/architecture/feature-inventory.md', 'utf8')
const blocksGuideSource = readFileSync('docs/guides/blocks.md', 'utf8')

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
  }

  return undefined
}

const baseReasons = [
  {
    description: 'Learning connected directly with real-world patient care.',
    title: 'Clinical Exposure',
  },
  {
    description: 'Guidance from medical educators and practicing clinicians.',
    title: 'Experienced Faculty',
  },
  {
    description: 'Laboratories and clinical facilities for contemporary education.',
    title: 'Modern Infrastructure',
  },
  {
    description: 'Preparing future doctors while supporting healthcare access.',
    title: 'Community Impact',
  },
]

describe('EditorialReasonsBlock schema', () => {
  it('defines its identity, content, and row limits', () => {
    expect(EditorialReasonsBlock).toMatchObject({
      slug: 'editorialReasons',
      interfaceName: 'EditorialReasonsBlock',
      labels: { singular: 'Editorial Reasons', plural: 'Editorial Reasons' },
    })
    expect(EditorialReasonsBlock.admin?.images?.thumbnail).toEqual({
      alt: 'Editorial Reasons block preview',
      url: '/block-thumbnails/editorial-reasons.jpg',
    })

    const tabs = EditorialReasonsBlock.fields.find((field) => field.type === 'tabs')
    expect(tabs && tabs.type === 'tabs' ? tabs.tabs.map((tab) => tab.label) : []).toEqual([
      'Content',
      'Theme Settings',
    ])
    expect(findNamedField(EditorialReasonsBlock.fields, 'title')).toMatchObject({
      type: 'text',
      required: true,
    })
    expect(findNamedField(EditorialReasonsBlock.fields, 'accentTitle')).toMatchObject({
      type: 'text',
    })
    expect(findNamedField(EditorialReasonsBlock.fields, 'actions')).toMatchObject({
      type: 'array',
      maxRows: 2,
    })
    expect(findNamedField(EditorialReasonsBlock.fields, 'reasons')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 8,
    })
  })

  it('defines reason links and approved theme controls', () => {
    const reasons = findNamedField(EditorialReasonsBlock.fields, 'reasons') as ArrayField
    const layoutProportion = findNamedField(
      EditorialReasonsBlock.fields,
      'layoutProportion',
    ) as SelectField
    const listPosition = findNamedField(EditorialReasonsBlock.fields, 'listPosition') as SelectField
    const contentAlignment = findNamedField(
      EditorialReasonsBlock.fields,
      'contentAlignment',
    ) as SelectField
    const listColumns = findNamedField(EditorialReasonsBlock.fields, 'listColumns') as SelectField
    const numberLayout = findNamedField(EditorialReasonsBlock.fields, 'numberLayout') as SelectField
    const listBorderStyle = findNamedField(
      EditorialReasonsBlock.fields,
      'listBorderStyle',
    ) as SelectField
    const introVerticalAlignment = findNamedField(
      EditorialReasonsBlock.fields,
      'introVerticalAlignment',
    ) as SelectField
    const stickyIntro = findNamedField(EditorialReasonsBlock.fields, 'stickyIntro') as CheckboxField

    expect(findNamedField(reasons.fields, 'linkType')).toMatchObject({
      type: 'radio',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
    })
    expect(findNamedField(reasons.fields, 'page')).toMatchObject({
      type: 'relationship',
      relationTo: 'pages',
    })
    expect(findNamedField(EditorialReasonsBlock.fields, 'appearance')).toBeDefined()
    expect(layoutProportion).toMatchObject({
      type: 'select',
      defaultValue: 'listFocus',
      required: true,
      options: [
        { label: 'List Focus (40 / 60)', value: 'listFocus' },
        { label: 'Balanced (50 / 50)', value: 'balanced' },
        { label: 'Introduction Focus (60 / 40)', value: 'introFocus' },
        { label: 'Full Width', value: 'fullWidth' },
      ],
    })
    expect(listPosition).toMatchObject({
      type: 'select',
      defaultValue: 'right',
      required: true,
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
    })
    expect(contentAlignment).toMatchObject({
      type: 'select',
      defaultValue: 'left',
      required: true,
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    })
    expect(listColumns).toMatchObject({
      type: 'select',
      defaultValue: '2',
      required: true,
      options: [
        { label: '1 Column', value: '1' },
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
    })
    expect(listColumns.admin?.condition?.({}, { numberLayout: 'stacked' }, {} as never)).toBe(true)
    expect(listColumns.admin?.condition?.({}, { numberLayout: 'inline' }, {} as never)).toBe(true)
    expect(listColumns.admin?.condition?.({}, { numberLayout: 'columns' }, {} as never)).toBe(false)
    expect(numberLayout).toMatchObject({
      type: 'select',
      defaultValue: 'stacked',
      required: true,
      options: [
        { label: 'Stacked (number above title)', value: 'stacked' },
        { label: 'Inline (number beside title)', value: 'inline' },
        {
          label: 'Three Columns (number + title + description)',
          value: 'columns',
        },
      ],
    })
    expect(listBorderStyle).toMatchObject({
      type: 'select',
      defaultValue: 'ruled',
      required: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Ruled', value: 'ruled' },
        { label: 'Framed', value: 'framed' },
      ],
    })
    expect(introVerticalAlignment).toMatchObject({
      type: 'select',
      defaultValue: 'top',
      required: true,
    })
    expect(stickyIntro).toMatchObject({
      type: 'checkbox',
      defaultValue: true,
    })
    expect(findNamedField(EditorialReasonsBlock.fields, 'size')).toMatchObject({
      type: 'select',
      defaultValue: 'default',
      required: true,
    })

    for (const field of [listPosition, introVerticalAlignment, stickyIntro]) {
      expect(field.admin?.condition?.({}, { layoutProportion: 'listFocus' }, {} as never)).toBe(
        true,
      )
      expect(field.admin?.condition?.({}, { layoutProportion: 'fullWidth' }, {} as never)).toBe(
        false,
      )
    }
  })
})

describe('EditorialReasonsBlockComponent', () => {
  it('renders the responsive asymmetric layout and ruled numbered list', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        accentTitle="Driven by purpose."
        description="A learning environment shaped around development and service."
        eyebrow="Why SNMIH"
        reasons={baseReasons}
        title="Built for learning."
      />,
    )

    expect(html).toContain('data-editorial-reasons="true"')
    expect(html).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(html).toContain('data-editorial-reasons-layout="listFocus"')
    expect(html).toContain('data-editorial-reasons-list-position="right"')
    expect(html).toContain('grid gap-10')
    expect(html).toContain('lg:gap-16')
    expect(html).toContain('data-editorial-reasons-intro="true"')
    expect(html).toContain('data-editorial-reasons-list="true"')
    expect(html).toContain('border-y border-current/15')
    expect(html).toContain('data-editorial-reasons-border-style="ruled"')
    expect(html.match(/data-editorial-reason="true"/g)).toHaveLength(4)
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(4)
    expect(html).toContain('>01<')
    expect(html).toContain('>04<')
    expect(html).toContain('flex max-w-3xl flex-col gap-4')
    expect(html).toContain('items-start')
    expect(html).toContain(
      'font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).toContain('font-[family-name:var(--font-display)]')
    expect(html.match(/font-\[inherit\]/g)).toHaveLength(2)
    expect(html).toContain('<em class="block font-[inherit]">Driven by purpose.</em>')
    expect(html).toContain('data-editorial-reasons-grid="true"')
    expect(html).toContain('grid-cols-1 md:grid-cols-2')
    expect(html).toContain('data-editorial-reasons-columns="2"')
    expect(html).not.toContain('grid-cols-[2rem_minmax(0,1fr)]')
    expect(html).toContain('font-sans text-md leading-tight font-semibold text-current')
    expect(html).toContain('text-sm leading-5 text-current')
  })

  it.each([
    ['listFocus', 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'],
    ['balanced', 'lg:grid-cols-2'],
    ['introFocus', 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'],
  ] as const)('maps the %s split proportion', (layoutProportion, expectedClass) => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        layoutProportion={layoutProportion}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain(expectedClass)
    expect(html).toContain(`data-editorial-reasons-layout="${layoutProportion}"`)
  })

  it('places the list on either side while preserving introduction-first DOM order', () => {
    const right = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listPosition="right"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )
    const left = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listPosition="left"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(right).toContain('data-editorial-reasons-list-position="right"')
    expect(right).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(right).toContain('lg:order-1')
    expect(right).toContain('lg:order-2')
    expect(left).toContain('data-editorial-reasons-list-position="left"')
    expect(left).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
    expect(left).toContain('lg:order-2')
    expect(left).toContain('lg:order-1')
    expect(left.indexOf('data-editorial-reasons-intro="true"')).toBeLessThan(
      left.indexOf('data-editorial-reasons-list="true"'),
    )
  })

  it('preserves the configured intro/list proportions when the list moves left', () => {
    const introFocus = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        layoutProportion="introFocus"
        listPosition="left"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )
    const balanced = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        layoutProportion="balanced"
        listPosition="left"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(introFocus).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(balanced).toContain('lg:grid-cols-2')
  })

  it('uses a container-wide list below the introduction in Full Width', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        introVerticalAlignment="bottom"
        layoutProportion="fullWidth"
        listPosition="left"
        reasons={baseReasons}
        stickyIntro
        title="Why choose us"
      />,
    )

    expect(html).toContain('data-editorial-reasons-layout="fullWidth"')
    expect(html).toContain('data-editorial-reasons-list-position="below"')
    expect(html).toContain('grid-cols-1 md:grid-cols-2')
    expect(html).toContain('data-editorial-reasons-columns="2"')
    expect(html).not.toContain('lg:order-')
    expect(html).not.toContain('lg:self-end')
    expect(html).not.toContain('lg:sticky')
  })

  it('uses safe defaults for stale layout values', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        layoutProportion={'legacy' as never}
        contentAlignment={'justify' as never}
        listColumns={'6' as never}
        listPosition={'below' as never}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain('data-editorial-reasons-layout="listFocus"')
    expect(html).toContain('data-editorial-reasons-list-position="right"')
    expect(html).toContain('data-editorial-reasons-content-alignment="left"')
    expect(html).toContain('data-editorial-reasons-columns="2"')
    expect(html).not.toContain('legacy')
  })

  it.each([
    ['top', 'lg:self-start'],
    ['center', 'lg:self-center'],
    ['bottom', 'lg:self-end'],
  ] as const)('maps %s introduction alignment', (introVerticalAlignment, expectedClass) => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        introVerticalAlignment={introVerticalAlignment}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain(expectedClass)
    expect(html).toContain(`data-editorial-reasons-intro-alignment="${introVerticalAlignment}"`)
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'mx-auto items-center text-center'],
    ['right', 'ml-auto items-end text-right'],
  ] as const)('aligns all section content to the %s', (contentAlignment, expectedClass) => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={[{ label: 'Explore admissions', linkType: 'custom', url: '/admissions' }]}
        contentAlignment={contentAlignment}
        description="A complete medical learning environment."
        eyebrow="Why us"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain(expectedClass)
    expect(html).toContain(`data-editorial-reasons-content-alignment="${contentAlignment}"`)
    expect(html).toContain(`data-content-alignment="${contentAlignment}"`)
  })

  it('enables stickiness only from the large breakpoint', () => {
    const sticky = renderToStaticMarkup(
      <EditorialReasonsBlockComponent reasons={baseReasons} stickyIntro title="Why choose us" />,
    )
    const staticMarkup = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        reasons={baseReasons}
        stickyIntro={false}
        title="Why choose us"
      />,
    )

    expect(sticky).toContain('lg:sticky lg:top-28')
    expect(sticky).toContain('data-editorial-reasons-sticky="true"')
    expect(staticMarkup).toContain('data-editorial-reasons-sticky="false"')
    expect(staticMarkup).not.toContain('lg:sticky')
  })

  it('filters invalid rows and resolves custom and hierarchical Page links', () => {
    const parent = { id: 'academics', slug: 'academics' } as unknown as Page
    const page = { id: 'why-us', parent, slug: 'why-us' } as unknown as Page
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        reasons={[
          { linkType: 'page', page, title: 'Clinical Exposure' },
          {
            linkType: 'custom',
            openInNewTab: true,
            title: 'Experienced Faculty',
            url: 'https://example.com/faculty',
          },
          { title: '   ' },
        ]}
        title="Why choose us"
      />,
    )

    expect(html.match(/data-editorial-reason="true"/g)).toHaveLength(2)
    expect(html).toContain('href="/academics/why-us"')
    expect(html).toContain('href="https://example.com/faculty"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
    expect(html).toContain('transition-opacity hover:opacity-70 hover:underline')
    expect(html).not.toContain('>03<')
  })

  it.each([
    ['1', 'grid-cols-1'],
    ['2', 'grid-cols-1 md:grid-cols-2 md:[&amp;&gt;*:nth-child(2n)]:border-l'],
    [
      '3',
      'grid-cols-1 md:grid-cols-2 md:[&amp;&gt;*:nth-child(2n)]:border-l xl:grid-cols-3 xl:[&amp;&gt;*:nth-child(3n+1)]:border-l-0 xl:[&amp;&gt;*:nth-child(3n+2)]:border-l xl:[&amp;&gt;*:nth-child(3n)]:border-l',
    ],
    [
      '4',
      'grid-cols-1 md:grid-cols-2 md:[&amp;&gt;*:nth-child(2n)]:border-l xl:grid-cols-4 xl:[&amp;&gt;*:nth-child(4n+3)]:border-l',
    ],
  ] as const)('supports %s responsive list columns', (listColumns, expectedClass) => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listColumns={listColumns}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain(`data-editorial-reasons-columns="${listColumns}"`)
    expect(html).toContain(expectedClass)
  })

  it('uses a number rail for inline and number-above cells for stacked, independent of column count', () => {
    const inlineOneColumn = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listColumns="1"
        numberLayout="inline"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )
    const stackedOneColumn = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listColumns="1"
        numberLayout="stacked"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )
    const inlineTwoColumns = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listColumns="2"
        numberLayout="inline"
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(inlineOneColumn).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(inlineOneColumn).toContain('sm:grid-cols-[4.5rem_minmax(0,1fr)]')
    expect(inlineOneColumn).toContain('pt-1 tabular-nums')
    expect(inlineOneColumn).toContain('data-editorial-reason-number-layout="inline"')

    expect(stackedOneColumn).toContain('flex flex-col')
    expect(stackedOneColumn).toContain('mb-6 tabular-nums')
    expect(stackedOneColumn).not.toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(stackedOneColumn).toContain('data-editorial-reason-number-layout="stacked"')

    // Proves numberLayout is independent of column count: inline still applies at 2 columns.
    expect(inlineTwoColumns).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(inlineTwoColumns).toContain('data-editorial-reason-number-layout="inline"')
  })

  it('renders three-column rows responsively and forces one outer list column', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listColumns="4"
        numberLayout="columns"
        reasons={[
          {
            description: 'Maintain high standards of teaching and assessment.',
            title: 'Academic Excellence',
          },
          {
            linkType: 'custom',
            openInNewTab: true,
            title: 'Student Development',
            url: 'https://example.edu/student-development',
          },
        ]}
        title="What shapes the learning environment"
      />,
    )

    expect(html).toContain('data-editorial-reasons-columns="1"')
    expect(html).toContain('grid-cols-1')
    expect(html).not.toContain('xl:grid-cols-4')
    expect(html.match(/data-editorial-reason-number-layout="columns"/g)).toHaveLength(2)
    expect(html.match(/data-editorial-reason-title="true"/g)).toHaveLength(2)
    expect(html.match(/data-editorial-reason-description="true"/g)).toHaveLength(1)
    expect(html).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
    expect(html).toContain('sm:grid-cols-[4.5rem_minmax(0,1fr)]')
    expect(html).toContain('lg:grid-cols-[4.5rem_minmax(0,1.1fr)_minmax(0,1fr)]')
    expect(html).toContain('col-start-2 lg:col-start-3 lg:row-start-1')
    expect(html).toContain('lg:col-span-2')
    expect(html.indexOf('>01<')).toBeLessThan(html.indexOf('data-editorial-reason-title="true"'))
    expect(html.indexOf('data-editorial-reason-title="true"')).toBeLessThan(
      html.indexOf('data-editorial-reason-description="true"'),
    )
    expect(html).toContain('href="https://example.edu/student-development"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
  })

  it.each([
    ['open', 'overflow-hidden', 'data-editorial-reasons-border-style="open"'],
    [
      'ruled',
      'overflow-hidden border-y border-current/15',
      'data-editorial-reasons-border-style="ruled"',
    ],
    [
      'framed',
      'overflow-hidden rounded-card border border-current/15',
      'data-editorial-reasons-border-style="framed"',
    ],
  ] as const)('maps the %s list border style', (listBorderStyle, expectedClass, dataHook) => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listBorderStyle={listBorderStyle}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain(expectedClass)
    expect(html).toContain(dataHook)
    expect(html).toContain('-mb-px')
    if (listBorderStyle === 'framed') {
      expect(html).not.toContain('-mx-6 -mb-px grid')
      const articleClasses = Array.from(html.matchAll(/<article class="([^"]+)"/g), (match) =>
        match[1].split(' '),
      )
      expect(articleClasses.every((classes) => !classes.includes('border-l'))).toBe(true)
    }
  })

  it('uses Ruled as the safe fallback for stale border values', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        listBorderStyle={'legacy' as never}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )

    expect(html).toContain('data-editorial-reasons-border-style="ruled"')
    expect(html).toContain('overflow-hidden border-y border-current/15')
    expect(html).not.toContain('legacy')
  })

  it('uses responsive columns, surface-aware numbers, and generalized dividers', () => {
    const split = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        appearance={{ background: 'brand' }}
        reasons={baseReasons}
        title="Why choose us"
      />,
    )
    const fullWidth = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        layoutProportion="fullWidth"
        listColumns="4"
        reasons={baseReasons.slice(0, 3)}
        title="Why choose us"
      />,
    )
    expect(split).toContain('grid-cols-1 md:grid-cols-2')
    expect(split).toContain('data-editorial-reasons-columns="2"')
    expect(split.match(/data-section-eyebrow-surface="brand"/g)).toHaveLength(4)
    expect(split.match(/aria-hidden="true"/g)).toHaveLength(4)
    expect(split).toContain('font-mono text-xs font-medium tracking-[0.14em] text-current')
    expect(split).toContain('flex flex-col')
    expect(split).toContain('border-b border-current/15')
    expect(split).toContain('md:[&amp;&gt;*:nth-child(2n)]:border-l')
    expect(split).not.toContain('shadow-[-1px_0_0_var(--border)]')

    expect(fullWidth).toContain('grid-cols-1 md:grid-cols-2')
    expect(fullWidth).toContain('xl:grid-cols-4')
    expect(fullWidth).toContain('data-editorial-reasons-columns="4"')
    expect(fullWidth).toContain('border-b border-current/15')
    expect(fullWidth).toContain('xl:[&amp;&gt;*:nth-child(4n+3)]:border-l')
  })

  it('uses semantic appearance, spacing, and shared actions', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={[
          {
            label: 'Explore admissions',
            linkType: 'custom',
            mode: 'button',
            showArrow: true,
            url: '/admissions',
            variant: 'default',
          },
        ]}
        appearance={{ background: 'brand', border: 'topAndBottom' }}
        eyebrow="Why us"
        reasons={baseReasons}
        size="comfortable"
        title="Built for learning"
      />,
    )

    expect(html).toContain('bg-brand text-primary-foreground border-y border-border')
    expect(html).toContain('py-20 md:py-28')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
    expect(html).toContain('data-editorial-reasons-actions="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-arrow="true"')
    expect(html).toContain('data-action-variant="default"')
    expect(html).not.toContain('data-surface-contrast')
  })

  it('uses the same semantic link color and treatment as Content Highlights', () => {
    const html = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={[
          {
            label: 'Explore admissions',
            linkType: 'custom',
            url: '/admissions',
          },
        ]}
        reasons={baseReasons}
        title="Built for learning"
      />,
    )

    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('text-primary')
    expect(html).toContain('text-sm font-semibold')
    expect(html).toContain('underline decoration-current decoration-2')
  })

  it('returns no markup without a title or usable reason', () => {
    expect(renderToStaticMarkup(<EditorialReasonsBlockComponent reasons={baseReasons} />)).toBe('')
    expect(
      renderToStaticMarkup(
        <EditorialReasonsBlockComponent reasons={[{ title: '   ' }]} title="Why choose us" />,
      ),
    ).toBe('')
  })

  it('drops the section actions to the foot of the column when asked', () => {
    const actions = [{ label: 'Learn more', linkType: 'custom' as const, url: '/about' }]
    const reasons = [{ description: 'Round-the-clock support.', title: '24x7 Emergency Care' }]

    const bottomHtml = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={actions}
        actionsPosition="bottom"
        reasons={reasons}
        title="Learning through care."
      />,
    )
    const inlineHtml = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={actions}
        actionsPosition="inline"
        reasons={reasons}
        title="Learning through care."
      />,
    )
    // Full Width has no second column to align against, so it stays inline.
    const fullWidthHtml = renderToStaticMarkup(
      <EditorialReasonsBlockComponent
        actions={actions}
        actionsPosition="bottom"
        layoutProportion="fullWidth"
        reasons={reasons}
        title="Learning through care."
      />,
    )

    expect(bottomHtml).toContain('data-editorial-reasons-actions-position="bottom"')
    expect(bottomHtml).toContain('lg:self-stretch')
    expect(bottomHtml).toContain('lg:h-full')
    expect(bottomHtml).toContain('lg:mt-auto')
    // Filling the row height and sticking to the viewport are incompatible.
    expect(bottomHtml).toContain('data-editorial-reasons-sticky="false"')
    expect(bottomHtml).not.toContain('lg:sticky')

    expect(inlineHtml).toContain('data-editorial-reasons-actions-position="inline"')
    expect(inlineHtml).toContain('lg:sticky')
    expect(inlineHtml).not.toContain('lg:mt-auto')
    expect(inlineHtml).not.toContain('lg:self-stretch')

    expect(fullWidthHtml).toContain('data-editorial-reasons-actions-position="inline"')
    expect(fullWidthHtml).not.toContain('lg:mt-auto')
  })
})

describe('Editorial Reasons registration', () => {
  it('is available to Pages, Reusable Sections, and both renderers', () => {
    expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('editorialReasons')
    expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('editorialReasons')
    expect(pageRendererSource).toContain("case 'editorialReasons':")
    expect(livePreviewRendererSource).toContain("case 'editorialReasons':")
  })
})

describe('Editorial Reasons catalogs', () => {
  it('is represented in generated Payload types', () => {
    expect(payloadTypesSource).toContain('export interface EditorialReasonsBlock')
    expect(payloadTypesSource).toContain("blockType: 'editorialReasons'")
    expect(payloadTypesSource).toContain(
      "layoutProportion: 'listFocus' | 'balanced' | 'introFocus' | 'fullWidth'",
    )
    expect(payloadTypesSource).toContain("listPosition?: ('right' | 'left') | null")
    expect(payloadTypesSource).toContain("contentAlignment: 'left' | 'center' | 'right'")
    expect(payloadTypesSource).toContain("listColumns?: ('1' | '2' | '3' | '4') | null")
    expect(payloadTypesSource).toContain("numberLayout: 'stacked' | 'inline' | 'columns'")
    expect(payloadTypesSource).toContain("listBorderStyle: 'open' | 'ruled' | 'framed'")
    expect(payloadTypesSource).toContain(
      "introVerticalAlignment?: ('top' | 'center' | 'bottom') | null",
    )
  })

  it('has thumbnail definition and fixture coverage', () => {
    expect(thumbnailDefinitionsSource).toContain("filename: 'editorial-reasons.jpg'")
    expect(thumbnailDefinitionsSource).toContain("slug: 'editorialReasons'")
    expect(thumbnailFixturesSource).toContain('editorialReasons:')
    expect(thumbnailFixturesSource).toContain('<EditorialReasonsBlockComponent')
    expect(thumbnailFixturesSource).toMatch(
      /editorialReasons:[\s\S]*listColumns="1"[\s\S]*numberLayout="columns"[\s\S]*cta39:/,
    )
  })
})

describe('Editorial Reasons documentation', () => {
  it('is recorded in architecture and operator documentation', () => {
    expect(featureInventorySource).toContain('Normal Pages register all 65 choices')
    expect(featureInventorySource).toContain('Editorial Reasons')
    expect(blocksGuideSource).toMatch(/\| Editorial Reasons\s+\|/)
    expect(blocksGuideSource).toContain('sticky introduction')
    expect(blocksGuideSource).toContain('responsive one-to-four-column numbered grid')
    expect(blocksGuideSource).toContain('Full Width')
    expect(blocksGuideSource).toContain('Three Columns')
    expect(blocksGuideSource).toContain('number, title, and description')
  })
})

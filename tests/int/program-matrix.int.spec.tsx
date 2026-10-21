import { readFileSync } from 'node:fs'

import { GraduationCap, Hospital, Users } from 'lucide-react'
import type { ArrayField, Field, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProgramMatrixBlockComponent } from '@/blocks/ProgramMatrix/Component'
import { ProgramMatrixBlock } from '@/blocks/ProgramMatrix/config'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
import { resolveLucideIcon } from '@/blocks/shared/resolveLucideIcon'
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
    if ('name' in field && field.name === name) {
      return field
    }

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

type AdminField = {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
    hidden?: boolean
  }
  name?: string
}

const getTabFields = (tabsField: TabsField, label: string): Field[] =>
  tabsField.tabs.find((tab) => tab.label === label)?.fields ?? []

describe('resolveLucideIcon', () => {
  it.each([
    ['Hospital', Hospital],
    ['hospital', Hospital],
    [' hospital ', Hospital],
    ['GraduationCap', GraduationCap],
    ['graduation-cap', GraduationCap],
    ['graduation_cap', GraduationCap],
    ['graduation cap icon', GraduationCap],
    ['users', Users],
    ['UserGroup', Users],
    ['user-group', Users],
    ['user group icon', Users],
  ])('resolves %s', (name, expectedIcon) => {
    expect(resolveLucideIcon(name)).toBe(expectedIcon)
  })

  it('omits empty and invalid icon names', () => {
    expect(resolveLucideIcon()).toBeUndefined()
    expect(resolveLucideIcon('')).toBeUndefined()
    expect(resolveLucideIcon('not-a-real-lucide-icon')).toBeUndefined()
  })
})

describe('ProgramMatrixBlock schema', () => {
  it('defines its identity and required item limits', () => {
    expect(ProgramMatrixBlock).toMatchObject({
      slug: 'programMatrix',
      interfaceName: 'ProgramMatrixBlock',
      labels: {
        singular: 'Program Matrix',
        plural: 'Program Matrices',
      },
    })
    expect(ProgramMatrixBlock.admin?.images?.thumbnail).toEqual({
      alt: 'Program Matrix block preview',
      url: '/block-thumbnails/program-matrix.jpg',
    })
    expect(findNamedField(ProgramMatrixBlock.fields, 'title')).toMatchObject({
      type: 'text',
      required: true,
    })
    expect(findNamedField(ProgramMatrixBlock.fields, 'items')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 24,
    })
  })

  it('defines the approved layout, action, appearance, and spacing controls', () => {
    const tabs = ProgramMatrixBlock.fields.find((field) => field.type === 'tabs') as TabsField
    const themeFields = getTabFields(tabs, 'Theme Settings')
    const itemsField = findNamedField(ProgramMatrixBlock.fields, 'items') as ArrayField
    const itemTabs = itemsField.fields[0] as TabsField
    const itemContentFields = getTabFields(itemTabs, 'Content')

    expect(tabs.tabs.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(itemTabs.tabs.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(findNamedField(ProgramMatrixBlock.fields, 'cardBackground')).toMatchObject({
      label: 'Background',
      type: 'select',
      defaultValue: 'default',
      required: true,
      options: [
        { label: 'Default Card', value: 'default' },
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
      ],
    })

    const cardAction = itemContentFields.find(
      (field) => 'name' in field && field.name === 'cardAction',
    ) as ArrayField

    expect(cardAction).toMatchObject({
      label: 'Card Action',
      type: 'array',
      maxRows: 1,
    })
    expect(findNamedField(cardAction.fields, 'label')).toMatchObject({
      type: 'text',
      required: true,
    })
    expect(findNamedField(cardAction.fields, 'mode')).toMatchObject({
      type: 'select',
      defaultValue: 'link',
    })
    expect(findNamedField(cardAction.fields, 'variant')).toMatchObject({ type: 'select' })
    expect(findNamedField(cardAction.fields, 'showArrow')).toMatchObject({ type: 'checkbox' })

    for (const legacyName of ['linkType', 'page', 'url', 'openInNewTab']) {
      const field = itemContentFields.find(
        (candidate) => 'name' in candidate && candidate.name === legacyName,
      ) as AdminField
      expect(field.admin?.hidden).toBe(true)
    }

    for (const legacyName of ['actionMode', 'actionVariant', 'itemActionLabel']) {
      const field = themeFields.find(
        (candidate) => 'name' in candidate && candidate.name === legacyName,
      ) as AdminField
      expect(field.admin?.hidden).toBe(true)
    }

    const headerLayout = themeFields.find(
      (field) => 'name' in field && field.name === 'headerLayout',
    )
    expect(headerLayout).toMatchObject({
      type: 'select',
      defaultValue: 'stacked',
      required: true,
      options: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Split', value: 'split' },
      ],
    })

    const headerPosition = themeFields.find(
      (field) => 'name' in field && field.name === 'headerPosition',
    ) as AdminField
    expect(headerPosition).toMatchObject({
      type: 'select',
      defaultValue: 'left',
      required: true,
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    })
    expect(headerPosition.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
    expect(headerPosition.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)

    const headerVerticalAlignment = themeFields.find(
      (field) => 'name' in field && field.name === 'headerVerticalAlignment',
    ) as AdminField
    expect(headerVerticalAlignment).toMatchObject({
      type: 'select',
      defaultValue: 'top',
      required: true,
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' },
      ],
    })
    expect(headerVerticalAlignment.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
    expect(headerVerticalAlignment.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)

    const columns = themeFields.find((field) => 'name' in field && field.name === 'columns')
    expect(columns).toMatchObject({
      label: 'Number of Columns',
      type: 'select',
      defaultValue: '2',
      required: true,
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
    })

    expect(findNamedField(ProgramMatrixBlock.fields, 'contentAlignment')).toMatchObject({
      type: 'select',
      defaultValue: 'left',
      required: true,
    })
    expect(findNamedField(ProgramMatrixBlock.fields, 'size')).toMatchObject({
      type: 'select',
      defaultValue: 'default',
      required: true,
    })
    expect(findNamedField(ProgramMatrixBlock.fields, 'appearance')).toBeDefined()
  })
})

const baseItems = [
  {
    description: 'Supervised clinical learning from the first semester.',
    icon: 'hospital',
    title: 'MBBS',
    metadata: '4.5 Years + 1 Year Internship',
  },
  {
    icon: 'graduation-cap',
    title: 'Postgraduate MD / MS',
    metadata: '3 Years',
  },
  {
    icon: 'heart-pulse',
    title: 'GNM & B.Sc Nursing',
    metadata: '3–4 Years',
  },
  {
    icon: 'microscope',
    title: 'Allied Health Sciences',
    metadata: '2–3 Years',
  },
]

describe('ProgramMatrixBlockComponent', () => {
  it('renders semantic responsive content and flexible icons', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        description="Four routes into clinical practice."
        eyebrow="Academics"
        items={baseItems}
        title="Programmes offered"
      />,
    )

    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(html).toContain('data-program-matrix="true"')
    expect(html).toContain('data-program-matrix-columns="2"')
    expect(html).toContain('md:grid-cols-2 lg:grid-cols-2')
    expect(html.match(/data-program-matrix-item="true"/g)).toHaveLength(4)
    expect(html).toContain('lucide-hospital')
    expect(html).toContain('lucide-graduation-cap')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('flex flex-col gap-10 md:gap-12')
    expect(html).toContain('flex max-w-3xl flex-col gap-4')
    expect(html).toContain(
      'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).not.toContain('font-serif')
    expect(html).toContain('max-w-[70ch] text-base leading-7 text-current/70')
    expect(html).toContain('p-6 text-left md:p-8 bg-transparent text-current border-border')
    expect(html).toContain('mb-4 size-5 shrink-0')
    expect(html).toContain('font-sans text-lg font-semibold leading-snug text-current')
    expect(html).toContain('mt-2 font-mono text-xs font-semibold uppercase tracking-[0.24em]')
    expect(html).toContain('mt-4 max-w-[65ch] text-sm leading-6')
  })

  it('defaults invalid layout values to a stacked left introduction', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout={'invalid' as never}
        headerPosition={'invalid' as never}
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-program-matrix-layout="stacked"')
    expect(html).toContain('data-program-matrix-header-position="left"')
    expect(html).not.toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
  })

  it('renders a 40/60 split with the introduction on the left', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout="split"
        headerPosition="left"
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-program-matrix-layout="split"')
    expect(html).toContain('data-program-matrix-header-position="left"')
    expect(html).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(html).not.toContain('lg:col-start-2 lg:row-start-1')
  })

  it('places a right-side split introduction visually without changing DOM order', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout="split"
        headerPosition="right"
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
    expect(html).toContain('lg:col-start-2 lg:row-start-1')
    expect(html).toContain('lg:col-start-1 lg:row-start-1')
    expect(html.indexOf('data-program-matrix-intro="true"')).toBeLessThan(
      html.indexOf('data-program-matrix="true"'),
    )
  })

  it('defaults missing and invalid split header vertical alignment to top', () => {
    const defaultHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent headerLayout="split" items={baseItems} title="Programmes" />,
    )
    const invalidHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout="split"
        headerVerticalAlignment={'invalid' as never}
        items={baseItems}
        title="Programmes"
      />,
    )

    for (const html of [defaultHtml, invalidHtml]) {
      expect(html).toContain('data-program-matrix-header-vertical-alignment="top"')
      expect(html).toContain('lg:self-start')
      expect(html).not.toContain('lg:self-center')
      expect(html).not.toContain('lg:self-end')
    }
  })

  it.each([
    ['center', 'lg:self-center'],
    ['bottom', 'lg:self-end'],
  ] as const)('aligns a split introduction to the %s', (alignment, expectedClass) => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout="split"
        headerVerticalAlignment={alignment}
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain(`data-program-matrix-header-vertical-alignment="${alignment}"`)
    expect(html).toContain(expectedClass)
    expect(html.indexOf('data-program-matrix-intro="true"')).toBeLessThan(
      html.indexOf('data-program-matrix="true"'),
    )
  })

  it('ignores saved vertical alignment in Stacked layout', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        headerLayout="stacked"
        headerVerticalAlignment="bottom"
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-program-matrix-layout="stacked"')
    expect(html).toContain('data-program-matrix-header-vertical-alignment="bottom"')
    expect(html).not.toContain('lg:self-start')
    expect(html).not.toContain('lg:self-center')
    expect(html).not.toContain('lg:self-end')
  })

  it.each([
    [undefined, '2', 'md:grid-cols-2 lg:grid-cols-2'],
    ['1', '1', 'md:grid-cols-1 lg:grid-cols-1'],
    ['2', '2', 'md:grid-cols-2 lg:grid-cols-2'],
    ['3', '3', 'md:grid-cols-2 lg:grid-cols-3'],
    ['4', '4', 'md:grid-cols-2 lg:grid-cols-4'],
  ] as const)(
    'renders %s configured columns as a responsive %s-column matrix',
    (columns, resolvedColumns, expectedClasses) => {
      const html = renderToStaticMarkup(
        <ProgramMatrixBlockComponent columns={columns} items={baseItems} title="Programmes" />,
      )

      expect(html).toContain(`data-program-matrix-columns="${resolvedColumns}"`)
      expect(html).toContain(expectedClasses)
    },
  )

  it('falls back to two columns for malformed saved values', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        columns={'invalid' as never}
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-program-matrix-columns="2"')
    expect(html).toContain('md:grid-cols-2 lg:grid-cols-2')
  })

  it('uses the shared eyebrow color treatment on colored section surfaces', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        appearance={{ background: 'brand' }}
        eyebrow="Academics"
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain(
      'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current',
    )
  })

  it('adapts every card surface through semantic theme classes', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[
          { cardBackground: 'default', title: 'Default' },
          { cardBackground: 'primary', title: 'Primary' },
          { cardBackground: 'secondary', title: 'Secondary' },
          { cardBackground: 'muted', title: 'Muted' },
          { cardBackground: 'accent', title: 'Accent' },
        ]}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-card-background="default"')
    expect(html).toContain('data-card-background="primary"')
    expect(html).toContain('data-card-background="secondary"')
    expect(html).toContain('data-card-background="muted"')
    expect(html).toContain('data-card-background="accent"')
    expect(html).toContain('bg-transparent text-current')
    expect(html).toContain('bg-primary text-primary-foreground')
    expect(html).toContain('bg-secondary text-secondary-foreground')
    expect(html).toContain('bg-muted text-foreground')
    expect(html).toContain('bg-accent text-accent-foreground')
    expect(html).toContain('border-primary-foreground/15')
    expect(html).toContain('border-secondary-foreground/15')
    expect(html).toContain('border-accent-foreground/15')
  })

  it('falls back to Default Card for an invalid surface value', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[{ cardBackground: 'invalid' as never, title: 'Legacy programme' }]}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-card-background="default"')
    expect(html).toContain('bg-transparent text-current')
  })

  it('honors link, button, and legacy programme action modes', () => {
    const linkHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actionMode="link"
        itemActionLabel="View programme"
        items={[
          {
            cardBackground: 'primary',
            linkType: 'custom',
            title: 'MBBS',
            url: '/mbbs',
          },
        ]}
        title="Programmes"
      />,
    )
    const buttonHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actionMode="button"
        actionVariant="secondary"
        itemActionLabel="Apply"
        items={[
          {
            cardBackground: 'secondary',
            linkType: 'custom',
            title: 'Nursing',
            url: '/nursing',
          },
        ]}
        title="Programmes"
      />,
    )
    const legacyHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[{ linkType: 'custom', title: 'Allied Health', url: '/allied-health' }]}
        title="Programmes"
      />,
    )

    expect(linkHtml).toContain('data-content-link="true"')
    expect(linkHtml).toContain('text-primary-foreground')
    expect(linkHtml).not.toContain('data-slot="button"')
    expect(buttonHtml).toContain('data-slot="button"')
    expect(buttonHtml).toContain('data-variant="secondary"')
    expect(buttonHtml).toContain('bg-secondary-foreground text-secondary')
    expect(buttonHtml).not.toContain('data-content-link="true"')
    expect(legacyHtml).toContain('data-content-link="true"')
  })

  it('renders independent link and button actions while leaving other cards non-interactive', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[
          {
            cardAction: [
              { label: 'View programme', linkType: 'custom', mode: 'link', url: '/mbbs' },
            ],
            title: 'MBBS',
          },
          {
            cardAction: [
              {
                label: 'Apply now',
                linkType: 'custom',
                mode: 'button',
                showArrow: true,
                url: '/apply/nursing',
                variant: 'secondary',
              },
            ],
            title: 'Nursing',
          },
          { title: 'Allied Health' },
        ]}
        title="Programmes"
      />,
    )

    expect(html.match(/data-program-matrix-item-action="true"/g)).toHaveLength(2)
    expect(html).toContain('href="/mbbs"')
    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('href="/apply/nursing"')
    expect(html).toContain('data-slot="button"')
    expect(html).toContain('data-variant="secondary"')
    expect(html).toContain('data-action-arrow="true"')
    expect(html).not.toContain('<a href="/mbbs"><article')
  })

  it('prefers a valid card action and falls back when the new row is incomplete', () => {
    const preferredHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        itemActionLabel="Legacy action"
        items={[
          {
            cardAction: [
              { label: 'New action', linkType: 'custom', mode: 'link', url: '/new-action' },
            ],
            linkType: 'custom',
            title: 'MBBS',
            url: '/legacy-action',
          },
        ]}
        title="Programmes"
      />,
    )
    const fallbackHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actionMode="button"
        actionVariant="secondary"
        itemActionLabel="Legacy action"
        items={[
          {
            cardAction: [{ label: '   ', linkType: 'custom', url: '/incomplete-action' }],
            linkType: 'custom',
            title: 'Nursing',
            url: '/legacy-action',
          },
        ]}
        title="Programmes"
      />,
    )

    expect(preferredHtml).toContain('href="/new-action"')
    expect(preferredHtml).not.toContain('/legacy-action')
    expect(fallbackHtml).toContain('href="/legacy-action"')
    expect(fallbackHtml).toContain('Legacy action')
    expect(fallbackHtml).toContain('data-slot="button"')
    expect(fallbackHtml).toContain('data-variant="secondary"')
    expect(fallbackHtml).not.toContain('/incomplete-action')
  })

  it('normalizes malformed card action display values', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[
          {
            cardAction: [
              {
                label: 'View programme',
                linkType: 'custom',
                mode: 'invalid' as never,
                url: '/view',
              },
            ],
            title: 'MBBS',
          },
          {
            cardAction: [
              {
                label: 'Apply now',
                linkType: 'custom',
                mode: 'button',
                url: '/apply',
                variant: 'invalid' as never,
              },
            ],
            title: 'Nursing',
          },
        ]}
        title="Programmes"
      />,
    )

    expect(html).toContain('href="/view"')
    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('data-variant="default"')
  })

  it('resolves card action page links and safe external targets', () => {
    const parent = { id: 'academics', slug: 'academics' } as unknown as Page
    const page = { id: 'mbbs', parent, slug: 'mbbs' } as unknown as Page
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[
          {
            cardAction: [{ label: 'View programme', linkType: 'page', page }],
            title: 'MBBS',
          },
          {
            cardAction: [
              {
                label: 'External prospectus',
                linkType: 'custom',
                openInNewTab: true,
                url: 'https://example.com/prospectus',
              },
            ],
            title: 'Prospectus',
          },
        ]}
        title="Programmes"
      />,
    )

    expect(html).toContain('href="/academics/mbbs"')
    expect(html).toContain('href="https://example.com/prospectus"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
  })

  it('adapts section actions when the block uses a matching colored surface', () => {
    const linkHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actions={[{ label: 'Explore', linkType: 'custom', url: '/programmes' }]}
        appearance={{ background: 'brand' }}
        items={baseItems}
        title="Programmes"
      />,
    )
    const buttonHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actions={[
          {
            label: 'Explore',
            linkType: 'custom',
            mode: 'button',
            url: '/programmes',
            variant: 'default',
          },
        ]}
        appearance={{ background: 'brand' }}
        items={baseItems}
        title="Programmes"
      />,
    )

    // Brand-surface contrast for BOTH buttons and links now comes from custom.css
    // (`.bg-brand [data-slot='button']...` and `.bg-brand [data-content-link='true']`),
    // so the component emits no per-variant Tailwind classes of its own — it only
    // marks the surface and lets each action declare its own display mode.
    expect(linkHtml).toContain('data-surface-contrast="true"')
    expect(buttonHtml).toContain('data-surface-contrast="true"')
    expect(linkHtml).toContain('data-action-mode="link"')
    expect(linkHtml).toContain('data-content-link="true"')
    expect(buttonHtml).toContain('data-action-mode="button"')
    expect(buttonHtml).toContain('data-slot="button"')
    expect(buttonHtml).toContain('data-variant="default"')
    // No hand-rolled contrast classes survive in either mode.
    expect(linkHtml).not.toContain(':text-current')
    expect(buttonHtml).not.toContain('bg-primary-foreground')
  })

  it('omits invalid rows and invalid icons without a fallback', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        items={[
          { icon: 'not-a-real-icon', title: 'Valid Programme' },
          { icon: 'star', title: '   ' },
        ]}
        title="Programmes"
      />,
    )

    expect(html).toContain('Valid Programme')
    expect(html).not.toContain('lucide-star')
    expect(html).not.toContain('data-program-icon="true"')
  })

  it('renders explicit link actions without wrapping the cell', () => {
    const linkHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        itemActionLabel="View Programme"
        items={[{ linkType: 'custom', title: 'MBBS', url: '/mbbs' }]}
        title="Programmes"
      />,
    )
    const newTabHtml = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        itemActionLabel="Apply"
        items={[
          {
            linkType: 'custom',
            openInNewTab: true,
            title: 'MBBS',
            url: 'https://example.com',
          },
        ]}
        title="Programmes"
      />,
    )

    expect(linkHtml).toContain('View Programme')
    expect(linkHtml).toContain('href="/mbbs"')
    expect(linkHtml).not.toContain('<a href="/mbbs"><article')
    expect(newTabHtml).toContain('Apply')
    expect(newTabHtml).toContain('target="_blank"')
    expect(newTabHtml).toContain('rel="noreferrer"')
  })

  it('resolves hierarchical page links and omits actions without a destination', () => {
    const parent = { id: 'academics', slug: 'academics' } as unknown as Page
    const page = { id: 'mbbs', parent, slug: 'mbbs' } as unknown as Page
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        itemActionLabel="View Programme"
        items={[
          { linkType: 'page', page, title: 'MBBS' },
          { linkType: 'none', title: 'Nursing' },
        ]}
        title="Programmes"
      />,
    )

    expect(html).toContain('href="/academics/mbbs"')
    expect(html.match(/View Programme/g)).toHaveLength(1)
  })

  it('calculates tablet and desktop dividers from the filtered rendered items', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        columns="3"
        items={[...baseItems, { title: '   ' }]}
        title="Programmes"
      />,
    )

    expect(html.match(/data-program-matrix-item="true"/g)).toHaveLength(4)
    expect(html.match(/data-tablet-row-end="true"/g)).toHaveLength(2)
    expect(html.match(/data-tablet-last-row="true"/g)).toHaveLength(2)
    expect(html.match(/data-desktop-row-end="true"/g)).toHaveLength(1)
    expect(html.match(/data-desktop-last-row="true"/g)).toHaveLength(1)
  })

  it('keeps right dividers on cards in an incomplete final desktop row', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        columns="3"
        items={[...baseItems, { title: 'Physiotherapy' }]}
        title="Programmes"
      />,
    )

    expect(html.match(/data-desktop-last-row="true"/g)).toHaveLength(2)
    expect(html.match(/data-desktop-row-end="true"/g)).toHaveLength(1)
    expect(html).toContain('lg:border-b-0 lg:border-r')
  })

  it('passes alignment to section actions and derives mode from action rows', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        actions={[
          {
            label: 'Explore programmes',
            linkType: 'custom',
            mode: 'button',
            url: '/programmes',
          },
        ]}
        contentAlignment="center"
        items={baseItems}
        title="Programmes"
      />,
    )

    expect(html).toContain('data-program-matrix-actions="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('items-center')
  })

  it('returns no markup without a title or valid items', () => {
    expect(renderToStaticMarkup(<ProgramMatrixBlockComponent items={baseItems} />)).toBe('')
    expect(
      renderToStaticMarkup(<ProgramMatrixBlockComponent items={[]} title="Programmes" />),
    ).toBe('')
  })
})

describe('Program Matrix registration', () => {
  it('is available to pages, reusable sections, and both renderers', () => {
    expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('programMatrix')
    expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('programMatrix')
    expect(pageRendererSource).toContain("case 'programMatrix':")
    expect(livePreviewRendererSource).toContain("case 'programMatrix':")
  })

  it('is represented in generated Payload types', () => {
    expect(payloadTypesSource).toContain('export interface ProgramMatrixBlock')
    expect(payloadTypesSource).toContain('cardAction?:')
    expect(payloadTypesSource).toContain(
      "cardBackground: 'default' | 'primary' | 'secondary' | 'muted' | 'accent'",
    )
    expect(payloadTypesSource).toContain("headerLayout: 'stacked' | 'split'")
    expect(payloadTypesSource).toContain("headerPosition?: ('left' | 'right') | null")
    expect(payloadTypesSource).toContain(
      "headerVerticalAlignment?: ('top' | 'center' | 'bottom') | null",
    )
    expect(payloadTypesSource).toContain("columns: '1' | '2' | '3' | '4'")
    expect(payloadTypesSource).toContain("blockType: 'programMatrix'")
  })
})

describe('Program Matrix catalogs', () => {
  it('has thumbnail definition and fixture coverage', () => {
    expect(thumbnailDefinitionsSource).toContain("filename: 'program-matrix.jpg'")
    expect(thumbnailDefinitionsSource).toContain("slug: 'programMatrix'")
    expect(thumbnailFixturesSource).toContain('programMatrix:')
    expect(thumbnailFixturesSource).toContain('<ProgramMatrixBlockComponent')
    expect(thumbnailFixturesSource).toContain('headerLayout="split"')
    expect(thumbnailFixturesSource).toContain('headerPosition="left"')
    expect(thumbnailFixturesSource).toContain('headerVerticalAlignment="center"')
    expect(thumbnailFixturesSource).toContain('columns="3"')
    expect(thumbnailFixturesSource).toContain('cardAction:')
    expect(thumbnailFixturesSource).toContain("label: 'View programme'")
    expect(thumbnailFixturesSource).toContain("label: 'Apply now'")
    expect(thumbnailFixturesSource).toContain("url: '/programmes/mbbs'")
  })

  it('is recorded in architecture and operator documentation', () => {
    expect(featureInventorySource).toContain('Normal Pages register all 61 choices')
    expect(featureInventorySource).toContain('Program Matrix')
    expect(featureInventorySource).toContain('introduction remains first in document order')
    expect(featureInventorySource).toContain('top, center, or bottom')
    expect(featureInventorySource).toContain('one to four responsive columns')
    expect(blocksGuideSource).toMatch(/\| Program Matrix\s+\|/)
    expect(blocksGuideSource).toContain('Stacked or 40/60 split introduction')
    expect(blocksGuideSource).toContain('top, center, or bottom vertical positioning')
    expect(blocksGuideSource).toContain('one to four responsive matrix columns')
    expect(blocksGuideSource).toContain('one optional per-card Link or Button action')
  })
})

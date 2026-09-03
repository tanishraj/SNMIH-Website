import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Cta39BlockComponent } from '@/blocks/Cta39/Component'
import { Cta39Block } from '@/blocks/Cta39/config'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'

import { getGeneratedPayloadInterface } from './helpers/generatedPayloadInterface'

type NamedField = {
  admin?: { condition?: unknown }
  defaultValue?: unknown
  fields?: NamedField[]
  label?: string
  maxRows?: number
  name?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  tabs?: Array<{ fields: NamedField[]; label: string }>
  type?: string
}

const findNamedField = (fields: NamedField[], name: string): NamedField | undefined => {
  for (const field of fields) {
    if (field.name === name) return field

    const nested = field.fields ?? field.tabs?.flatMap((tab) => tab.fields) ?? []
    const match = findNamedField(nested, name)
    if (match) return match
  }
}

const selectValues = (fields: NamedField[], name: string) =>
  findNamedField(fields, name)?.options?.map((option) => option.value)

describe('Call to Action block', () => {
  it('defines the standard content and theme controls', () => {
    const tabs = Cta39Block.fields[0] as NamedField
    const contentTab = tabs.tabs?.find((tab) => tab.label === 'Content')
    const themeTab = tabs.tabs?.find((tab) => tab.label === 'Theme Settings')
    const allFields = tabs.tabs?.flatMap((tab) => tab.fields) ?? []

    expect(Cta39Block).toMatchObject({
      interfaceName: 'Cta39Block',
      labels: { plural: 'Call to Actions', singular: 'Call to Action' },
      slug: 'cta39',
    })
    expect(tabs.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(contentTab?.fields.map((field) => field.name)).toEqual([
      'eyebrow',
      'title',
      'accentTitle',
      'description',
      'actions',
      'footerActions',
    ])
    expect(themeTab?.fields.map((field) => field.name)).toEqual([
      'appearance',
      'headerLayout',
      'contentAlignment',
      'splitContentAlignment',
      'actionLayout',
      'size',
    ])
    expect(findNamedField(allFields, 'eyebrow')).toMatchObject({ type: 'text' })
    expect(findNamedField(allFields, 'title')).toMatchObject({ required: true, type: 'text' })
    expect(findNamedField(allFields, 'description')).toMatchObject({ type: 'textarea' })
    expect(findNamedField(allFields, 'actions')).toMatchObject({
      label: 'Section Actions',
      maxRows: 2,
      type: 'array',
    })
    expect(findNamedField(allFields, 'footerActions')).toMatchObject({
      label: 'Footer Actions',
      maxRows: 2,
      type: 'array',
    })
    expect(findNamedField(allFields, 'borderStyle')).toBeUndefined()
    expect(findNamedField(allFields, 'headerLayout')).toMatchObject({
      defaultValue: 'stacked',
      required: true,
      type: 'select',
    })
    expect(selectValues(allFields, 'headerLayout')).toEqual(['stacked', 'split', 'actionSplit'])
    expect(findNamedField(allFields, 'headerLayout')?.options).toEqual([
      { label: 'Stacked', value: 'stacked' },
      { label: 'Content Split', value: 'split' },
      { label: 'Action Split', value: 'actionSplit' },
    ])
    expect(selectValues(allFields, 'contentAlignment')).toEqual(['left', 'center', 'right'])
    expect(findNamedField(allFields, 'splitContentAlignment')).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })
    expect(findNamedField(allFields, 'splitContentAlignment')?.admin?.condition).toBeTypeOf(
      'function',
    )
    expect(selectValues(allFields, 'splitContentAlignment')).toEqual(['top', 'center', 'bottom'])
    expect(findNamedField(allFields, 'actionLayout')).toMatchObject({
      defaultValue: 'inline',
      required: true,
      type: 'select',
    })
    expect(findNamedField(allFields, 'actionLayout')?.admin?.condition).toBeTypeOf('function')
    expect(selectValues(allFields, 'actionLayout')).toEqual(['inline', 'stacked'])
    expect(selectValues(allFields, 'size')).toEqual(['none', 'compact', 'default', 'comfortable'])
  })

  it('renders a readable stacked CTA directly on the section surface', () => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        actions={[{ label: 'Visit campus', linkType: 'custom', url: '/visit' }]}
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        contentAlignment="center"
        description="Visit SNMIH and experience the campus, classrooms, teaching facilities, and hospital environment."
        eyebrow="Plan your visit"
        footerActions={[{ label: 'Admissions', linkType: 'custom', url: '/admissions' }]}
        title="Come see our campus for yourself."
      />,
    )

    expect(html).toContain('data-cta39="true"')
    expect(html).toContain('data-cta39-layout="stacked"')
    expect(html).toContain('data-cta39-background="subtle"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('Plan your visit')
    expect(html).toContain('max-w-2xl')
    expect(html).toContain('text-base leading-7 text-balance text-current')
    expect(html).toContain('href="/visit"')
    expect(html).toContain('href="/admissions"')
    expect(html).not.toContain('rounded-xl')
    expect(html).not.toContain('bg-background')
    expect(html).not.toContain('border-dashed')
  })

  it.each([
    ['none', '', 'none'],
    ['subtle', 'bg-subtle', 'subtle'],
    ['brand', 'bg-brand', 'brand'],
  ] as const)('inherits the %s section surface', (background, backgroundClass, eyebrowSurface) => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        appearance={{ background, border: 'none' }}
        eyebrow="Apply today"
        title="Begin your journey."
      />,
    )

    if (backgroundClass) expect(html).toContain(backgroundClass)
    expect(html).toContain(`data-cta39-background="${background}"`)
    expect(html).toContain(`data-section-eyebrow-surface="${eyebrowSurface}"`)
    expect(html).not.toContain('bg-background')
  })

  it.each([
    ['top', 'lg:self-start'],
    ['center', 'lg:self-center'],
    ['bottom', 'lg:self-end'],
  ] as const)('aligns split supporting content to the %s', (splitContentAlignment, className) => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        actions={[{ label: 'Apply', linkType: 'custom', url: '/apply' }]}
        description="Choose the route that fits your next step."
        headerLayout="split"
        splitContentAlignment={splitContentAlignment}
        title="Start your application."
      />,
    )

    expect(html).toContain('data-cta39-layout="split"')
    expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
    expect(html).toContain(`data-cta39-split-alignment="${splitContentAlignment}"`)
    expect(html).toContain(className)
    expect(html.indexOf('Start your application.')).toBeLessThan(
      html.indexOf('Choose the route that fits your next step.'),
    )
  })

  it('renders Action Split with copy left and actions on the desktop right edge', () => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        actions={[
          { label: 'Apply now', linkType: 'custom', url: '/apply' },
          { label: 'Book a visit', linkType: 'custom', url: '/visit' },
        ]}
        description="Choose your route and take the next step."
        eyebrow="Admissions"
        headerLayout="actionSplit"
        title="Start your application."
      />,
    )

    expect(html).toContain('data-cta39-layout="actionSplit"')
    expect(html).toContain('lg:grid-cols-[minmax(0,1fr)_auto]')
    expect(html).toContain('lg:justify-self-end')
    expect(html).toContain('data-cta39-action-layout="inline"')
    expect(html).toContain('lg:flex-row')
    expect(html).toContain('max-w-2xl')
    expect(html.indexOf('Admissions')).toBeLessThan(html.indexOf('Start your application.'))
    expect(html.indexOf('Start your application.')).toBeLessThan(
      html.indexOf('Choose your route and take the next step.'),
    )
    expect(html.indexOf('Choose your route and take the next step.')).toBeLessThan(
      html.indexOf('Apply now'),
    )
  })

  it.each([
    ['inline', 'lg:flex-row'],
    ['stacked', 'lg:flex-col'],
  ] as const)('arranges Action Split buttons %s on desktop', (actionLayout, className) => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        actionLayout={actionLayout}
        actions={[
          {
            label: 'Apply',
            linkType: 'custom',
            mode: 'button',
            url: '/apply',
            variant: 'primary',
          },
        ]}
        contentAlignment="center"
        headerLayout="actionSplit"
        title="Take the next step."
      />,
    )

    expect(html).toContain(`data-cta39-action-layout="${actionLayout}"`)
    expect(html).toContain(className)
    expect(html).toContain('items-center sm:justify-center')
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'items-center text-center'],
    ['right', 'items-end text-right'],
  ] as const)('aligns CTA content to the %s', (contentAlignment, className) => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent contentAlignment={contentAlignment} title="Take the next step." />,
    )

    expect(html).toContain(`data-content-alignment="${contentAlignment}"`)
    expect(html).toContain(className)
  })

  it('uses safe defaults for stale layout values', () => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        contentAlignment={'stale' as never}
        headerLayout={'stale' as never}
        size={'stale' as never}
        splitContentAlignment={'stale' as never}
        title="Take the next step."
      />,
    )

    expect(html).toContain('data-cta39-layout="stacked"')
    expect(html).toContain('data-content-alignment="center"')
    expect(html).toContain('py-12 md:py-16')

    const staleSplit = renderToStaticMarkup(
      <Cta39BlockComponent
        description="Supporting copy"
        headerLayout="split"
        splitContentAlignment={'stale' as never}
        title="Take the next step."
      />,
    )
    expect(staleSplit).toContain('data-cta39-split-alignment="center"')
    expect(staleSplit).toContain('lg:self-center')

    const staleActionSplit = renderToStaticMarkup(
      <Cta39BlockComponent
        actionLayout={'stale' as never}
        actions={[{ label: 'Apply', linkType: 'custom', url: '/apply' }]}
        headerLayout="actionSplit"
        title="Take the next step."
      />,
    )
    expect(staleActionSplit).toContain('data-cta39-layout="actionSplit"')
    expect(staleActionSplit).toContain('data-cta39-action-layout="inline"')
    expect(staleActionSplit).toContain('lg:flex-row')
  })

  it('falls back to stacked when split has no supporting content', () => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent headerLayout="split" title="Take the next step." />,
    )

    expect(html).toContain('data-cta39-layout="stacked"')
    expect(html).not.toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
  })

  it('falls back to Stacked when Action Split has no valid section actions', () => {
    const html = renderToStaticMarkup(
      <Cta39BlockComponent
        actions={[{ label: 'Missing destination', linkType: 'custom', url: '' }]}
        description="Supporting copy remains with the CTA."
        headerLayout="actionSplit"
        title="Take the next step."
      />,
    )

    expect(html).toContain('data-cta39-layout="stacked"')
    expect(html).toContain('Supporting copy remains with the CTA.')
    expect(html).not.toContain('data-cta39-action-layout')
    expect(html).not.toContain('lg:justify-self-end')
  })

  it('returns no markup without a usable title', () => {
    expect(Cta39BlockComponent({ title: '   ' })).toBeNull()
  })

  it('is registered across schemas, renderers, and generated types', () => {
    expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('cta39')
    expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('cta39')

    const sources = [
      'src/blocks/renderPageBlocks.tsx',
      'src/blocks/renderLivePreviewPageBlocks.tsx',
    ].map((file) => readFileSync(file, 'utf8'))

    for (const source of sources) {
      expect(source).toMatch(/Cta39|cta39/)
    }

    const generatedTypes = readFileSync('src/payload-types.ts', 'utf8')
    const ctaType = getGeneratedPayloadInterface(generatedTypes, 'Cta39Block')
    expect(ctaType).toContain('eyebrow?: string | null;')
    expect(ctaType).toContain("headerLayout: 'stacked' | 'split' | 'actionSplit';")
    expect(ctaType).toContain("splitContentAlignment?: ('top' | 'center' | 'bottom') | null;")
    expect(ctaType).toContain("actionLayout?: ('inline' | 'stacked') | null;")
    expect(ctaType).not.toContain('borderStyle')
  })
})

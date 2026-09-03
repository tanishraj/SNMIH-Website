import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FeatureMatrixBlockComponent } from '@/blocks/FeatureMatrix/Component'
import { FeatureMatrixBlock } from '@/blocks/FeatureMatrix/config'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { Pages } from '@/collections/Pages'
import { FeatureMatrix } from '@/components/feature-matrix'

type TestField = {
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  type?: string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const features = [
  {
    title: 'Learning spaces',
    description: 'Purpose-built spaces for focused and collaborative learning.',
    image: { alt: 'Learning space', src: '/media/learning-space.jpg' },
  },
  {
    title: 'Practical labs',
    description: 'Hands-on environments with modern equipment and support.',
    image: { alt: 'Practical lab', src: '/media/practical-lab.jpg' },
  },
  {
    title: 'Student services',
    description: 'Helpful resources for every stage of the student experience.',
    image: { alt: 'Student support', src: '/media/student-support.jpg' },
  },
  {
    title: 'Community programs',
    description: 'Programs that connect learning with the wider community.',
    image: { alt: 'Community program', src: '/media/community-program.jpg' },
  },
]

describe('Feature Matrix presentation', () => {
  it('uses the canonical Payload identity', () => {
    expect(FeatureMatrixBlock.slug).toBe('featureMatrix')
    expect(FeatureMatrixBlock.interfaceName).toBe('FeatureMatrixBlock')
    expect(FeatureMatrixBlock.labels).toEqual({
      singular: 'Feature Matrix',
      plural: 'Feature Matrices',
    })
  })

  it('renders the compact four-panel asymmetric matrix with semantic styling', () => {
    const html = renderToStaticMarkup(
      FeatureMatrix({
        actions: 'Explore our facilities',
        alignment: 'center',
        appearance: { background: 'subtle', border: 'topAndBottom' },
        description: 'Four practical ways the learning environment supports every student.',
        eyebrow: 'Facilities',
        features,
        size: 'compact',
        title: 'Designed around the way you learn',
      }),
    )

    expect(html).toContain('data-feature-matrix="true"')
    expect(html).not.toContain('data-feature166')
    expect(html).toContain('data-feature-matrix-size="compact"')
    expect(html).toContain('py-10')
    expect(html).toContain('data-feature-matrix-alignment="center"')
    expect(html).toContain('data-feature-matrix-border-animation="enabled"')
    expect(html).toContain('data-feature-matrix-outer-border="shown"')
    expect(html.match(/data-feature-matrix-divider-beam="horizontal"/g)).toHaveLength(3)
    expect(html.match(/data-feature-matrix-divider-beam="vertical"/g)).toHaveLength(2)
    expect(html).toContain('lg:col-span-3')
    expect(html).toContain('lg:col-span-2')
    expect(html).toContain('border-border')
    expect(html).toContain('overflow-hidden rounded-card border border-current/10')
    expect(html).not.toContain('rounded-[var(--radius)]')
    expect(html.match(/flex flex-col gap-1/g)).toHaveLength(4)
    expect(html).toContain('border-b border-current/10 lg:border-r lg:border-b-0')
    expect(html).toContain('Explore our facilities')
    expect(html.match(/h-44 md:h-48 lg:h-52/g)).toHaveLength(4)
    expect(html).not.toContain('aspect-[1.45]')
    expect(html).not.toContain('lg:aspect-[2.4]')
    expect(html).not.toMatch(/<h3[^>]*>Learning spaces<\/h3>/)
    expect(
      html.match(/<p class="text-base leading-tight font-semibold text-current">/g),
    ).toHaveLength(4)
    expect(html.match(/<p class="text-sm leading-6 text-current">/g)).toHaveLength(4)

    for (const feature of features) {
      expect(html).toContain(feature.title)
      expect(html).toContain(encodeURIComponent(feature.image.src))
    }
  })

  it.each([
    ['compact', 'h-44 md:h-48 lg:h-52'],
    ['default', 'h-48 md:h-52 lg:h-56'],
    ['comfortable', 'h-52 md:h-64 lg:h-72'],
  ] as const)('applies equal responsive image heights in %s mode', (size, classes) => {
    const html = renderToStaticMarkup(FeatureMatrix({ features, size, title: 'What we provide' }))

    expect(html.match(new RegExp(classes, 'g'))).toHaveLength(4)
  })

  it('defines exactly four features and shared content/layout controls', () => {
    const tabsField = FeatureMatrixBlock.fields[0] as unknown as { tabs: TestTab[]; type: string }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')

    expect(tabsField.type).toBe('tabs')
    expect(contentTab).toBeDefined()
    expect(layoutTab).toBeDefined()

    const featuresField = getField(contentTab?.fields ?? [], 'features')
    const actionsField = getField(contentTab?.fields ?? [], 'actions')
    // Features use createCardTabs which wraps fields in a tabs structure
    const featureTabsField = featuresField?.fields?.[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const featureContentTab = featureTabsField?.tabs?.find(({ label }) => label === 'Content')
    const featureThemeTab = featureTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')
    const featureTitleField = getField(featureContentTab?.fields ?? [], 'title')
    const featureImageField = getField(featureContentTab?.fields ?? [], 'image')
    const featureImagePositionField = getField(featureThemeTab?.fields ?? [], 'imagePosition')
    const alignmentField = getField(layoutTab?.fields ?? [], 'contentAlignment')
    const actionsTabsField = actionsField?.fields?.[0] as unknown as
      { tabs: TestTab[]; type: string } | undefined
    const actionsThemeTab = actionsTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')
    const actionModeField = getField(actionsThemeTab?.fields ?? [], 'mode')
    const sizeField = getField(layoutTab?.fields ?? [], 'size')
    const showOuterBorderField = getField(layoutTab?.fields ?? [], 'showOuterBorder')
    const borderAnimationEnabledField = getField(layoutTab?.fields ?? [], 'borderAnimationEnabled')

    expect(actionsField?.maxRows).toBe(2)
    expect(featuresField?.minRows).toBe(4)
    expect(featuresField?.maxRows).toBe(4)
    expect(featureTitleField?.required).toBeUndefined()
    expect(featureImageField).toMatchObject({ relationTo: 'media', required: true, type: 'upload' })
    expect(featureImagePositionField).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })
    expect(featureImagePositionField?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(alignmentField?.defaultValue).toBe('center')
    expect(actionModeField).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(sizeField?.defaultValue).toBe('default')
    expect(showOuterBorderField).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(borderAnimationEnabledField).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(sizeField?.options?.map(({ value }) => value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
  })

  it('can hide only the matrix outer border while retaining panel dividers', () => {
    const html = renderToStaticMarkup(
      FeatureMatrix({
        alignment: 'left',
        features,
        showOuterBorder: false,
        size: 'compact',
        title: 'What we provide',
      }),
    )

    expect(html).toContain('data-feature-matrix-outer-border="hidden"')
    expect(html).toContain('grid overflow-hidden rounded-card lg:grid-cols-5')
    expect(html).not.toContain('grid overflow-hidden rounded-card border border-border')
    expect(html).toContain('border-b border-current/10 lg:border-r')
  })

  it('can disable decorative beams without removing the static internal dividers', () => {
    const html = renderToStaticMarkup(
      FeatureMatrix({
        alignment: 'left',
        borderAnimationEnabled: false,
        features,
        size: 'compact',
        title: 'What we provide',
      }),
    )

    expect(html).toContain('data-feature-matrix-border-animation="disabled"')
    expect(html).not.toContain('data-feature-matrix-divider-beam=')
    expect(html).toContain('border-b border-current/10 lg:border-r')
    expect(html).toContain('border-b border-current/10 lg:border-r lg:border-b-0')
  })

  it('applies an independent focal position to every image with a center fallback', () => {
    const positionedHtml = renderToStaticMarkup(
      FeatureMatrix({
        features: features.map((feature, index) => ({
          ...feature,
          imagePosition: ['top', 'bottom', 'left', 'right'][index] as
            'bottom' | 'left' | 'right' | 'top',
        })),
        title: 'What we provide',
      }),
    )

    expect(positionedHtml.match(/object-\[center_top\]/g)).toHaveLength(1)
    expect(positionedHtml.match(/object-\[center_bottom\]/g)).toHaveLength(1)
    expect(positionedHtml.match(/object-\[left_center\]/g)).toHaveLength(1)
    expect(positionedHtml.match(/object-\[right_center\]/g)).toHaveLength(1)
    expect(positionedHtml).toContain('data-feature-matrix-image-position="top"')
    expect(positionedHtml).toContain('data-feature-matrix-image-position="right"')

    const fallbackHtml = renderToStaticMarkup(
      FeatureMatrix({
        features: features.map((feature, index) => ({
          ...feature,
          imagePosition: index === 0 ? null : undefined,
        })),
        title: 'What we provide',
      }),
    )

    expect(fallbackHtml.match(/object-\[center_center\]/g)).toHaveLength(4)
    expect(fallbackHtml.match(/data-feature-matrix-image-position="center"/g)).toHaveLength(4)
  })

  it('uses the semantic primary token and removes motion when requested', () => {
    const globalStyles = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')
    const customStyles = readFileSync(resolve(process.cwd(), 'src/styles/custom.css'), 'utf8')

    expect(globalStyles).toContain("@import './custom.css';")
    expect(globalStyles).not.toContain('.feature-matrix-divider-beam')
    expect(globalStyles).not.toContain('@keyframes feature-matrix-divider-beam-horizontal')
    expect(customStyles).toContain('.feature-matrix-divider-beam')
    expect(customStyles).toMatch(
      /feature-matrix-divider-beam\[data-feature-matrix-divider-beam='horizontal'\]::after[\s\S]*background: linear-gradient\(90deg, transparent, var\(--primary\), transparent\)/,
    )
    expect(customStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.feature-matrix-divider-beam[\s\S]*display: none/,
    )
  })

  it('resolves Payload media and shared button actions through the block wrapper', () => {
    const html = renderToStaticMarkup(
      FeatureMatrixBlockComponent({
        actions: [
          {
            label: 'Explore facilities',
            linkType: 'custom',
            mode: 'button',
            url: '/facilities',
            variant: 'outline',
          },
        ],
        appearance: { background: 'subtle', border: 'top' },
        borderAnimationEnabled: false,
        contentAlignment: 'left',
        description: 'Spaces and services designed for practical learning.',
        eyebrow: 'Facilities',
        features: features.map((feature, index) => ({
          description: feature.description,
          image: {
            alt: feature.image.alt,
            id: index + 1,
            url: feature.image.src,
          },
          imagePosition: index === 0 ? 'bottom' : 'center',
          title: feature.title,
        })),
        size: 'compact',
        title: 'What we provide',
      }),
    )

    expect(html).toContain('data-feature-matrix-alignment="left"')
    expect(html).toContain('data-feature-matrix-border-animation="disabled"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/facilities"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('%2Fmedia%2Flearning-space.jpg')
    expect(html).toContain('object-[center_bottom]')
  })

  it('registers and renders Feature Matrix through the page block pipeline', () => {
    const tabsField = Pages.fields.find((field) => field.type === 'tabs')
    const contentTab = tabsField?.type === 'tabs' ? tabsField.tabs[0] : undefined
    const layoutField = contentTab?.fields.find(
      (field) => 'name' in field && field.name === 'layout',
    )
    const registeredSlugs =
      layoutField?.type === 'blocks' ? layoutField.blocks.map(({ slug }) => slug) : []

    expect(registeredSlugs).toContain('featureMatrix')
    expect(registeredSlugs).not.toContain('feature166')

    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'featureMatrix',
          contentAlignment: 'center',
          features: features.map((feature, index) => ({
            description: feature.description,
            image: {
              alt: feature.image.alt,
              id: index + 1,
              url: feature.image.src,
            },
            title: feature.title,
          })),
          size: 'compact',
          title: 'What we provide',
        } as never,
      ]),
    )

    expect(html).toContain('data-feature-matrix="true"')
    expect(html).toContain('What we provide')
  })
})

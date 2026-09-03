import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { IconGridBlockComponent } from '@/blocks/IconGrid/Component'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import {
  contentItemDescriptionClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'

const findField = (
  fields: unknown[],
  name: string,
  label?: string,
): Record<string, unknown> | undefined => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if (
      'name' in field &&
      field.name === name &&
      (!label || ('label' in field && field.label === label))
    ) {
      return field as Record<string, unknown>
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findField(field.fields, name, label)
      if (nested) return nested
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nested = findField(tab.fields, name, label)
          if (nested) return nested
        }
      }
    }
  }

  return undefined
}

const payloadTypesSource = readFileSync('src/payload-types.ts', 'utf8')
const blocksGuideSource = readFileSync('docs/guides/blocks.md', 'utf8')
const thumbnailFixtureSource = readFileSync('src/block-thumbnails/fixtures.tsx', 'utf8')

describe('Icon Grid Ruled Columns', () => {
  it('exposes Ruled Columns without changing existing presentation values or the default', () => {
    const variantField = findField(IconGridBlock.fields, 'variant', 'Card Style')

    expect(variantField).toMatchObject({
      defaultValue: 'card',
      label: 'Card Style',
      name: 'variant',
      type: 'select',
    })
    expect(variantField?.options).toEqual([
      { label: 'Card (bordered box)', value: 'card' },
      { label: 'Contact Cards', value: 'contactCards' },
      { label: 'Minimal (icon + text, no box)', value: 'minimal' },
      { label: 'Icon Top (centered icon above title)', value: 'iconTop' },
      { label: 'Ruled Columns', value: 'ruled' },
    ])
  })

  it('explains which presentations ignore per-item backgrounds', () => {
    const cardBackgroundField = findField(IconGridBlock.fields, 'cardBackground')

    expect(cardBackgroundField).toMatchObject({
      admin: {
        description:
          'Applied to the Card and Contact Cards presentations. Match Section inherits the section surface; Minimal, Icon Top, and Ruled Columns inherit the section surface.',
      },
    })
  })

  it('includes ruled in the generated Payload contract', () => {
    expect(payloadTypesSource).toContain(
      "variant?: ('card' | 'contactCards' | 'minimal' | 'iconTop' | 'ruled') | null;",
    )
  })

  it.each([
    ['2', 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l'],
    [
      '3',
      'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t-0 lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
    ],
    [
      '4',
      'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-4 lg:[&>*:nth-child(-n+4)]:border-t-0 lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*:nth-child(4n+2)]:border-l lg:[&>*:nth-child(4n+3)]:border-l lg:[&>*:nth-child(4n)]:border-l',
    ],
  ] as const)('renders clean responsive divider geometry for %s columns', (columns, classes) => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        columns={columns}
        items={[
          { title: 'Education' },
          { title: 'Healthcare' },
          { title: 'Community' },
          { title: 'Research' },
          { title: 'Service' },
        ]}
        variant="ruled"
      />,
    )

    expect(html).toContain('data-icon-grid-grid="ruled"')
    expect(html).toContain(
      'grid grid-cols-1 gap-0 border-y [&amp;&gt;*]:border-t [&amp;&gt;*:first-child]:border-t-0',
    )
    for (const className of classes.split(' ')) {
      expect(html).toContain(className.replaceAll('&', '&amp;').replaceAll('>', '&gt;'))
    }
    expect(html.match(/data-icon-grid-presentation="ruled"/g)).toHaveLength(5)
  })

  it('inherits the section surface and ignores per-item card backgrounds', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        appearance={{ background: 'brand' }}
        iconStyle="outline"
        items={[
          {
            cardBackground: 'gradient-brand',
            description: 'Build strong academic foundations.',
            icon: 'GraduationCap',
            title: 'Education',
          },
        ]}
        variant="ruled"
      />,
    )

    expect(html).toContain('data-icon-grid-presentation="ruled"')
    for (const className of contentItemTitleClasses.split(' ')) {
      expect(html).toContain(className)
    }
    for (const className of contentItemDescriptionClasses.split(' ')) {
      expect(html).toContain(className)
    }
    expect(html).not.toContain('font-[family-name:var(--font-display)]')
    expect(html).not.toContain('text-2xl')
    expect(html).not.toContain('text-base leading-7')
    expect(html).toContain('border-current/15')
    expect(html).toContain('text-sm leading-5 whitespace-pre-line text-current')
    expect(html).toContain('rounded-compact border')
    expect(html).not.toContain('data-card-background')
    expect(html).not.toContain('bg-card-gradient-brand')
    expect(html).not.toContain('rounded-card border p-6')
    expect(html).not.toContain('shadow-sm')
  })

  it('keeps Link mode as one full-item anchor with safe new-tab attributes', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        actionMode="link"
        itemActionLabel="Learn more"
        items={[
          {
            linkType: 'custom',
            openInNewTab: true,
            title: 'Education',
            url: 'https://example.edu/education',
          },
        ]}
        variant="ruled"
      />,
    )

    expect(html.match(/<a\b/g)).toHaveLength(1)
    expect(html).toContain('href="https://example.edu/education"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Learn more')
    expect(html).toContain('focus-visible:ring-2')
    expect(html).toContain('data-icon-grid-presentation="ruled"')
  })

  it('keeps Button mode as an article containing one linked shared button', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        actionMode="button"
        actionVariant="outline"
        itemActionLabel="Explore"
        items={[{ linkType: 'custom', title: 'Healthcare', url: '/healthcare' }]}
        variant="ruled"
      />,
    )

    expect(html).toContain('<article')
    expect(html.match(/<a\b/g)).toHaveLength(1)
    expect(html).toContain('href="/healthcare"')
    expect(html).toContain('Explore')
    expect(html).toContain('data-slot="button"')
  })

  it('omits missing icons, keeps the stale-icon fallback, filters blank titles, and handles empty data', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        items={[
          { icon: null, title: 'Education' },
          { icon: 'RemovedIconName', title: 'Healthcare' },
          { icon: 'Hospital', title: '   ' },
        ]}
        variant="ruled"
      />,
    )

    expect(html.match(/data-icon-grid-presentation="ruled"/g)).toHaveLength(2)
    expect(html.match(/<svg\b/g)).toHaveLength(1)
    expect(html).not.toContain('Hospital')
    expect(
      renderToStaticMarkup(<IconGridBlockComponent items={[{ title: '   ' }]} variant="ruled" />),
    ).toBe('')
  })

  it('continues to send a stale presentation through the Card fallback', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        items={[{ cardBackground: 'primary', title: 'Fallback card' }]}
        variant={'removed-presentation' as never}
      />,
    )

    expect(html).toContain('data-card-background="brand"')
    expect(html).not.toContain('data-icon-grid-presentation="ruled"')
  })

  it('documents and demonstrates Ruled Columns', () => {
    expect(blocksGuideSource).toMatch(/\| Icon Grid\s+\|/)
    expect(blocksGuideSource).toContain('Ruled Columns')
    expect(blocksGuideSource).toContain('inherit the section surface')
    expect(thumbnailFixtureSource).toMatch(
      /iconGrid:[\s\S]*variant="ruled"[\s\S]*iconCardShowcase:/,
    )
  })
})

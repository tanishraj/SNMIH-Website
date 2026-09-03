import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { Footer56Block } from '@/blocks/Footer56/config'
import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/config'
import { ContentActions } from '@/components/ContentActions'
import { ContentLink } from '@/components/ContentLink'
import { getCmsActionAnchorProps, resolveCmsActions } from '@/lib/cmsLinks'

const file = {
  id: 'media-1',
  alt: 'Programme handbook',
  filename: 'programme-handbook.pdf',
  mimeType: 'application/pdf',
  updatedAt: '2026-08-26T00:00:00.000Z',
  createdAt: '2026-08-26T00:00:00.000Z',
  url: '/api/media/file/programme-handbook.pdf',
} as const

type TestField = {
  admin?: { condition?: unknown; hidden?: boolean }
  defaultValue?: unknown
  filterOptions?: unknown
  label?: string
  name?: string
  options?: Array<{ label: string; value: string }>
  relationTo?: string
  required?: boolean
  tabs?: Array<{ fields: TestField[]; label: string }>
  type?: string
}

const getActionTabs = (includeDisplayMode = false) => {
  const field = createContentActionsField({ includeDisplayMode })
  return (field.fields[0] as TestField).tabs ?? []
}

const findFieldsByName = (value: unknown, name: string): TestField[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => findFieldsByName(item, name))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const field = value as TestField & Record<string, unknown>
  const matches = field.name === name ? [field] : []

  return [...matches, ...Object.values(field).flatMap((item) => findFieldsByName(item, name))]
}

describe('content action presentation', () => {
  it('can restrict a shared action to one PDF Download Button', () => {
    const field = createContentActionsField({
      actionLabel: 'Button Label',
      allowedLinkTypes: ['file'],
      defaultVariant: 'outline',
      fileFilterOptions: { mimeType: { equals: 'application/pdf' } },
      fixedFileBehavior: 'download',
      includeDisplayMode: false,
      includeNavigationArrow: false,
      label: 'Download Button',
      maxRows: 1,
      name: 'calendarPdfAction',
    })
    const tabs = (field.fields[0] as TestField).tabs ?? []
    const content = tabs.find((tab) => tab.label === 'Content')?.fields ?? []
    const theme = tabs.find((tab) => tab.label === 'Theme Settings')?.fields ?? []

    expect(field).toMatchObject({
      label: 'Download Button',
      maxRows: 1,
      name: 'calendarPdfAction',
    })
    expect(content.map((item) => item.name)).toEqual(['label', 'linkType', 'file', 'fileBehavior'])
    expect(content.find((item) => item.name === 'label')).toMatchObject({
      label: 'Button Label',
      required: true,
    })
    expect(content.find((item) => item.name === 'linkType')).toMatchObject({
      defaultValue: 'file',
      options: [{ label: 'File', value: 'file' }],
      admin: expect.objectContaining({ hidden: true }),
    })
    expect(content.find((item) => item.name === 'file')).toMatchObject({
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      relationTo: 'media',
    })
    expect(content.find((item) => item.name === 'fileBehavior')).toMatchObject({
      defaultValue: 'download',
      admin: expect.objectContaining({ hidden: true }),
    })
    expect(theme.map((item) => item.name)).toEqual(['variant', 'showFileIcon', 'fileIconPosition'])
    expect(theme.find((item) => item.name === 'variant')).toMatchObject({
      defaultValue: 'outline',
    })
  })

  it('offers Page, Custom URL, and File destinations', () => {
    const fields = getActionTabs(true).find((tab) => tab.label === 'Content')?.fields ?? []
    const linkType = fields.find((field) => field.name === 'linkType')

    expect(linkType?.options?.map((option) => option.value)).toEqual(['page', 'custom', 'file'])
    expect(fields.find((field) => field.name === 'file')).toMatchObject({
      relationTo: 'media',
      type: 'upload',
    })
    expect(fields.find((field) => field.name === 'fileBehavior')).toMatchObject({
      defaultValue: 'view',
      type: 'select',
    })
    expect(fields.find((field) => field.name === 'openFileInNewTab')).toMatchObject({
      defaultValue: true,
      type: 'checkbox',
    })
  })

  it('shows destination controls only for matching action data', () => {
    const fields = getActionTabs(true).find((tab) => tab.label === 'Content')?.fields ?? []
    const condition = (name: string) =>
      fields.find((field) => field.name === name)?.admin?.condition as
        ((_data: unknown, siblings: Record<string, unknown>) => boolean) | undefined

    expect(condition('page')?.({}, { linkType: 'page' })).toBe(true)
    expect(condition('url')?.({}, { linkType: 'custom' })).toBe(true)
    expect(condition('file')?.({}, { linkType: 'file' })).toBe(true)
    expect(condition('openInNewTab')?.({}, { linkType: 'file' })).toBe(false)
    expect(condition('openFileInNewTab')?.({}, { fileBehavior: 'view', linkType: 'file' })).toBe(
      true,
    )
    expect(
      condition('openFileInNewTab')?.({}, { fileBehavior: 'download', linkType: 'file' }),
    ).toBe(false)
  })

  it('defines an opt-in button arrow in shared action theme settings', () => {
    const themeFields = getActionTabs().find((tab) => tab.label === 'Theme Settings')?.fields ?? []

    expect(themeFields.find((field) => field.name === 'showArrow')).toMatchObject({
      defaultValue: false,
      label: 'Show arrow',
      type: 'checkbox',
    })
  })

  it('only exposes the row arrow control for button display mode', () => {
    const themeFields =
      getActionTabs(true).find((tab) => tab.label === 'Theme Settings')?.fields ?? []
    const field = themeFields.find((item) => item.name === 'showArrow')
    const condition = field?.admin?.condition as
      ((_data: unknown, siblings: { mode?: string }) => boolean) | undefined

    expect(condition?.({}, { mode: 'button' })).toBe(true)
    expect(condition?.({}, { mode: 'link' })).toBe(false)
  })

  it('exposes download-only icon controls with semantic defaults', () => {
    const fields = getActionTabs(true).flatMap((tab) => tab.fields)

    expect(fields.find((field) => field.name === 'showFileIcon')).toMatchObject({
      defaultValue: true,
      label: 'Show Download Icon',
      type: 'checkbox',
    })
    expect(fields.find((field) => field.name === 'fileIconPosition')).toMatchObject({
      defaultValue: 'left',
      label: 'Download Icon Position',
      type: 'select',
    })
  })

  it('hides the normal arrow for downloads and reveals position only with an icon', () => {
    const fields = getActionTabs(true).flatMap((tab) => tab.fields)
    const condition = (name: string) =>
      fields.find((field) => field.name === name)?.admin?.condition as
        ((_data: unknown, siblings: Record<string, unknown>) => boolean) | undefined

    const download = { fileBehavior: 'download', linkType: 'file', mode: 'button' }
    expect(condition('showArrow')?.({}, download)).toBe(false)
    expect(condition('showFileIcon')?.({}, download)).toBe(true)
    expect(condition('fileIconPosition')?.({}, { ...download, showFileIcon: true })).toBe(true)
    expect(condition('fileIconPosition')?.({}, { ...download, showFileIcon: false })).toBe(false)
    expect(
      condition('showArrow')?.({}, { fileBehavior: 'view', linkType: 'file', mode: 'button' }),
    ).toBe(true)
  })

  it.each([
    ['Hero Banner', HeroBannerBlock],
    ['Hero Carousel', HeroCarouselBlock],
    ['Header Navbar', HeaderNavbar12Block],
    ['Footer', Footer56Block],
  ] as const)('defines the opt-in arrow for %s CTAs', (_label, block) => {
    expect(findFieldsByName(block.fields, 'showArrow')).toContainEqual(
      expect.objectContaining({
        defaultValue: false,
        label: 'Show arrow',
        type: 'checkbox',
      }),
    )
  })

  it('defaults missing arrows to false and preserves explicit arrows', () => {
    expect(
      resolveCmsActions([
        { label: 'Plain', linkType: 'custom', url: '/plain' },
        { label: 'Arrow', linkType: 'custom', showArrow: true, url: '/arrow' },
      ]),
    ).toEqual([
      expect.objectContaining({ href: '/plain', showArrow: false }),
      expect.objectContaining({ href: '/arrow', showArrow: true }),
    ])
  })

  it('resolves File View with its own new-tab preference', () => {
    expect(
      resolveCmsActions([
        {
          file,
          fileBehavior: 'view',
          label: 'View handbook',
          linkType: 'file',
          openFileInNewTab: true,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        download: undefined,
        href: '/api/media/file/programme-handbook.pdf',
        openInNewTab: true,
      }),
    ])
  })

  it('resolves File Download without opening another tab', () => {
    const [action] = resolveCmsActions([
      {
        file,
        fileBehavior: 'download',
        label: 'Download handbook',
        linkType: 'file',
        openFileInNewTab: true,
      },
    ])

    expect(action).toMatchObject({
      download: 'programme-handbook.pdf',
      href: '/api/media/file/programme-handbook.pdf',
      openInNewTab: false,
    })
    expect(getCmsActionAnchorProps(action)).toEqual({
      download: 'programme-handbook.pdf',
      href: '/api/media/file/programme-handbook.pdf',
      rel: undefined,
      target: undefined,
    })
  })

  it('resolves the default download indicator on the left', () => {
    expect(
      resolveCmsActions([
        { file, fileBehavior: 'download', label: 'Download', linkType: 'file' },
      ])[0],
    ).toMatchObject({ indicator: 'download', indicatorPosition: 'left' })
  })

  it('resolves right-positioned and hidden download indicators', () => {
    expect(
      resolveCmsActions([
        {
          file,
          fileBehavior: 'download',
          fileIconPosition: 'right',
          label: 'Download',
          linkType: 'file',
        },
      ])[0],
    ).toMatchObject({ indicator: 'download', indicatorPosition: 'right' })

    expect(
      resolveCmsActions([
        {
          file,
          fileBehavior: 'download',
          label: 'Download',
          linkType: 'file',
          showFileIcon: false,
        },
      ])[0],
    ).toMatchObject({ indicator: 'none', indicatorPosition: 'left' })
  })

  it('does not assign a download indicator to File View', () => {
    expect(
      resolveCmsActions([{ file, fileBehavior: 'view', label: 'View', linkType: 'file' }])[0],
    ).toMatchObject({ indicator: undefined, indicatorPosition: undefined })
  })

  it('falls back to the boolean download behavior when Media has no filename', () => {
    expect(
      resolveCmsActions([
        {
          file: { ...file, filename: null },
          fileBehavior: 'download',
          label: 'Download handbook',
          linkType: 'file',
        },
      ])[0],
    ).toMatchObject({ download: true })
  })

  it('omits unresolved File relationships', () => {
    expect(resolveCmsActions([{ file: 'media-1', label: 'Broken', linkType: 'file' }])).toEqual([])
  })

  it('underlines the editorial label without underlining its icon', () => {
    const html = renderToStaticMarkup(
      createElement(ContentLink, { href: '/programs', label: 'Explore programs' }),
    )

    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('data-content-link-label="true"')
    expect(html).toContain('underline-offset-4')
    expect(html).toContain('data-content-link-arrow="true"')
  })

  it('renders a decorative arrow only for opted-in buttons', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          { href: '/plain', label: 'Plain', mode: 'button', showArrow: false, variant: 'default' },
          { href: '/arrow', label: 'Arrow', mode: 'button', showArrow: true, variant: 'outline' },
        ],
      }),
    )

    expect(html.match(/data-action-arrow="true"/g) ?? []).toHaveLength(1)
    expect(html).toContain('aria-hidden="true"')
  })

  it('keeps link-style CTAs editorial and ignores their button arrow', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          { href: '/read', label: 'Read more', mode: 'button', showArrow: true, variant: 'link' },
        ],
      }),
    )

    expect(html).toContain('data-content-link="true"')
    expect(html).not.toContain('data-action-arrow="true"')
  })

  it('renders a mixed row as a button next to a link, reporting button mode on the container', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          {
            href: '/apply',
            label: 'Apply now',
            mode: 'button',
            showArrow: false,
            variant: 'default',
          },
          {
            href: '/learn-more',
            label: 'Learn more',
            mode: 'link',
            showArrow: false,
            variant: 'default',
          },
        ],
      }),
    )

    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-slot="button"')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('href="/learn-more"')
  })

  it('applies optional card-surface classes to buttons and links', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          { href: '/apply', label: 'Apply', mode: 'button', showArrow: false, variant: 'default' },
          {
            href: '/details',
            label: 'Details',
            mode: 'link',
            showArrow: false,
            variant: 'default',
          },
        ],
        buttonClassNames: { default: 'surface-default-button' },
        linkClassName: 'surface-link',
      }),
    )

    expect(html).toContain('surface-default-button')
    expect(html).toContain('surface-link')
  })

  it('renders downloads for shared Button and Link actions', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          {
            download: 'button.pdf',
            href: '/button.pdf',
            label: 'Download button',
            mode: 'button',
            openInNewTab: false,
            showArrow: false,
            variant: 'default',
          },
          {
            download: 'link.pdf',
            href: '/link.pdf',
            label: 'Download link',
            mode: 'link',
            openInNewTab: false,
            showArrow: false,
            variant: 'default',
          },
        ],
      }),
    )

    expect(html).toMatch(/<a(?=[^>]*href="\/button\.pdf")(?=[^>]*download="button\.pdf")[^>]*>/)
    expect(html).toMatch(/<a(?=[^>]*href="\/link\.pdf")(?=[^>]*download="link\.pdf")[^>]*>/)
    expect(html).not.toContain('target="_blank"')
  })

  it('renders an animated Lucide down arrow before a download Button label', () => {
    const html = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          {
            download: 'guide.pdf',
            href: '/guide.pdf',
            indicator: 'download',
            indicatorPosition: 'left',
            label: 'Download guide',
            mode: 'button',
            showArrow: true,
            variant: 'default',
          },
        ],
      }),
    )

    expect(html).toContain('data-action-indicator="download"')
    expect(html).toContain('lucide-arrow-down')
    expect(html.indexOf('data-action-indicator="download"')).toBeLessThan(
      html.indexOf('Download guide'),
    )
    expect(html).not.toContain('lucide-arrow-right')
    expect(html).toContain('motion-reduce:group-hover/button:opacity-100')
    expect(html).toContain('motion-reduce:group-hover/button:opacity-0')
  })

  it('positions or hides the download indicator for editorial Links', () => {
    const right = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          {
            download: 'guide.pdf',
            href: '/guide.pdf',
            indicator: 'download',
            indicatorPosition: 'right',
            label: 'Download guide',
            mode: 'link',
            showArrow: false,
            variant: 'default',
          },
        ],
      }),
    )
    const hidden = renderToStaticMarkup(
      createElement(ContentActions, {
        actions: [
          {
            download: 'guide.pdf',
            href: '/guide.pdf',
            indicator: 'none',
            indicatorPosition: 'left',
            label: 'Download guide',
            mode: 'link',
            showArrow: false,
            variant: 'default',
          },
        ],
      }),
    )

    expect(right.indexOf('Download guide')).toBeLessThan(
      right.indexOf('data-action-indicator="download"'),
    )
    expect(hidden).not.toContain('data-action-indicator')
    expect(hidden).not.toContain('lucide-arrow-right')
  })

  it('keeps navigation Links on the existing animated right arrow', () => {
    const html = renderToStaticMarkup(
      createElement(ContentLink, { href: '/programmes', label: 'View programmes' }),
    )

    expect(html).toContain('lucide-arrow-right')
    expect(html).not.toContain('lucide-arrow-down')
  })

  it.each([
    'src/blocks/Services21/Component.tsx',
    'src/blocks/ProgramMatrix/Component.tsx',
    'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
    'src/blocks/HeroBanner/Component.tsx',
    'src/blocks/HeroCarousel/HeroCarouselClient.tsx',
  ])('forwards Button file-action semantics in %s', (filePath) => {
    const source = readFileSync(filePath, 'utf8')
    expect(source).toContain('getCmsActionAnchorProps')
    expect(source).toContain('download=')
  })

  it.each([
    'src/blocks/Services21/Component.tsx',
    'src/blocks/ProgramMatrix/Component.tsx',
    'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
    'src/blocks/HeroBanner/Component.tsx',
    'src/blocks/HeroCarousel/HeroCarouselClient.tsx',
  ])('forwards resolved action indicators in %s', (filePath) => {
    const source = readFileSync(filePath, 'utf8')

    expect(source).toContain('indicator=')
    expect(source).toContain('indicatorPosition=')
  })

  it.each(['src/blocks/HeroBanner/Component.tsx', 'src/blocks/HeroCarousel/Component.tsx'])(
    'carries resolved link indicators through %s',
    (filePath) => {
      const source = readFileSync(filePath, 'utf8')

      expect(source).toContain('indicator: link.indicator')
      expect(source).toContain('indicatorPosition: link.indicatorPosition')
    },
  )

  it('keeps generated action rows aligned with File destinations', () => {
    const source = readFileSync('src/payload-types.ts', 'utf8')
    expect(source).toContain("linkType?: ('page' | 'custom' | 'file') | null")
    expect(source).toContain("fileBehavior?: ('view' | 'download') | null")
    expect(source).toContain('showFileIcon?: boolean | null')
    expect(source).toContain("fileIconPosition?: ('left' | 'right') | null")
    expect(source).toContain('openFileInNewTab?: boolean | null')
  })

  it.each([
    'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
    'src/blocks/Services21/Component.tsx',
  ])('uses the shared button-arrow primitive in %s', (file) => {
    const source = readFileSync(file, 'utf8')

    expect(source).toContain('ActionButtonContent')
    expect(source).toContain('showArrow=')
  })
})

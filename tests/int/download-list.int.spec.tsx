import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ArrayField, CollapsibleField, Field, RadioField, SelectField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { DownloadListBlockComponent } from '@/blocks/DownloadList/Component'
import { DownloadListBlock } from '@/blocks/DownloadList/config'
import { normalizeGridColumns } from '@/blocks/DownloadList/Presentation'
import { resolveDocumentActions } from '@/blocks/DownloadList/resolveActions'
import type { Media } from '@/payload-types'

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
}

const fallback = {
  downloadHref: '/api/media/file/fallback.pdf',
  openViewInNewTab: true,
  showDownload: true,
  showView: true,
  viewHref: '/fallback',
}

const sharedMedia = {
  id: 'policy',
  mimeType: 'application/pdf',
  url: '/api/media/file/policy.pdf',
} as unknown as Media

const documents = [
  {
    category: 'NMC',
    externalUrl: '/policy',
    file: sharedMedia,
    fileType: 'PDF',
    title: 'Policy',
  },
]

afterEach(cleanup)

describe('DownloadListBlock schema', () => {
  it('offers the four supported presentations', () => {
    expect(findNamedField(DownloadListBlock.fields, 'displayMode')).toMatchObject({
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Inline List', value: 'list' },
        { label: 'Boxed Card Grid', value: 'cards' },
        { label: 'Open Grid', value: 'openGrid' },
        { label: 'Framed Grid', value: 'framedGrid' },
      ],
    })
  })

  it('uses one shared Columns control for every presentation', () => {
    const columns = findNamedField(DownloadListBlock.fields, 'columns') as SelectField

    expect(columns.options).toHaveLength(8)
    expect(columns).toMatchObject({ type: 'select', defaultValue: '3', required: true })
    expect(columns.admin?.condition).toBeUndefined()
    expect(findNamedField(DownloadListBlock.fields, 'inlineColumns')).toBeUndefined()
  })

  it('offers a stacked or split section with responsive introduction placement', () => {
    const sectionLayout = findNamedField(DownloadListBlock.fields, 'sectionLayout') as SelectField
    const introPosition = findNamedField(DownloadListBlock.fields, 'introPosition') as SelectField
    const introVerticalAlignment = findNamedField(
      DownloadListBlock.fields,
      'introVerticalAlignment',
    ) as SelectField

    expect(sectionLayout).toMatchObject({
      type: 'select',
      defaultValue: 'stacked',
      required: true,
      options: [
        { label: 'Stacked', value: 'stacked' },
        { label: 'Split', value: 'split' },
      ],
    })
    expect(introPosition.admin?.condition?.({}, { sectionLayout: 'split' }, {} as never)).toBe(true)
    expect(introPosition.admin?.condition?.({}, { sectionLayout: 'stacked' }, {} as never)).toBe(
      false,
    )
    expect(introVerticalAlignment).toMatchObject({
      defaultValue: 'top',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' },
      ],
    })
  })

  it('offers one shared optional document-icon control', () => {
    expect(findNamedField(DownloadListBlock.fields, 'showDocumentIcon')).toMatchObject({
      type: 'checkbox',
      defaultValue: true,
    })
    expect(findNamedField(DownloadListBlock.fields, 'gridIconPosition')).toMatchObject({
      options: [
        { label: 'Above Title', value: 'above' },
        { label: 'Left of Content', value: 'inline' },
      ],
    })
  })

  it('offers an optional preset file-type override with automatic fallback', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const fileType = findNamedField(downloads.fields, 'fileType') as SelectField

    expect(fileType).toMatchObject({
      type: 'select',
      label: 'File Type Label',
      options: [
        { label: 'PDF', value: 'PDF' },
        { label: 'DOC', value: 'DOC' },
        { label: 'DOCX', value: 'DOCX' },
        { label: 'XLS', value: 'XLS' },
        { label: 'XLSX', value: 'XLSX' },
        { label: 'CSV', value: 'CSV' },
        { label: 'PPT', value: 'PPT' },
        { label: 'PPTX', value: 'PPTX' },
        { label: 'ZIP', value: 'ZIP' },
      ],
    })
    expect(fileType.required).not.toBe(true)
    expect(fileType.defaultValue).toBeUndefined()
  })

  it('removes document categories and category filtering', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField

    expect(findNamedField(downloads.fields, 'category')).toBeUndefined()
    expect(findNamedField(DownloadListBlock.fields, 'showFilter')).toBeUndefined()
  })

  it('offers one grid-wide labelled or icon-only action setting', () => {
    const field = findNamedField(DownloadListBlock.fields, 'gridActionDisplay') as SelectField

    expect(field).toMatchObject({
      type: 'select',
      defaultValue: 'labelled',
      required: true,
      options: [
        { label: 'Labelled', value: 'labelled' },
        { label: 'Icon only', value: 'icons' },
      ],
    })
    expect(field.admin?.condition?.({}, { displayMode: 'cards' }, {} as never)).toBe(true)
    expect(field.admin?.condition?.({}, { displayMode: 'openGrid' }, {} as never)).toBe(true)
    expect(field.admin?.condition?.({}, { displayMode: 'framedGrid' }, {} as never)).toBe(true)
    expect(field.admin?.condition?.({}, { displayMode: 'list' }, {} as never)).toBe(false)
  })

  it('removes visual action controls and the Inline badge control', () => {
    for (const name of [
      'showInlineFileType',
      'viewActionAppearance',
      'viewActionLabel',
      'viewActionIconMode',
      'viewActionIcon',
      'downloadActionAppearance',
      'downloadActionLabel',
      'downloadActionIconMode',
      'downloadActionIcon',
    ]) {
      expect(findNamedField(DownloadListBlock.fields, name)).toBeUndefined()
    }

    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const manualActions = findNamedField(downloads.fields, 'actions') as ArrayField
    expect(findNamedField(manualActions.fields, 'actionAppearance')).toBeUndefined()
    expect(findNamedField(manualActions.fields, 'iconMode')).toBeUndefined()
    expect(findNamedField(manualActions.fields, 'icon')).toBeUndefined()
  })

  it('retains main icon sizing and conditional grid positioning', () => {
    expect(findNamedField(DownloadListBlock.fields, 'documentIconSize')).toMatchObject({
      type: 'select',
      defaultValue: 'medium',
      required: true,
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    })

    const position = findNamedField(DownloadListBlock.fields, 'gridIconPosition') as SelectField
    expect(position.admin?.condition?.({}, { displayMode: 'framedGrid' }, {} as never)).toBe(true)
    expect(position.admin?.condition?.({}, { displayMode: 'list' }, {} as never)).toBe(false)
  })

  it('offers at most two ordered actions per document', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
    const actionType = findNamedField(actions.fields, 'actionType') as RadioField

    expect(actions).toMatchObject({ type: 'array', maxRows: 2 })
    expect(actionType).toMatchObject({
      type: 'radio',
      defaultValue: 'download',
      required: true,
      options: [
        { label: 'Download', value: 'download' },
        { label: 'View', value: 'view' },
        { label: 'Custom', value: 'custom' },
      ],
    })
  })

  it('reveals only fields relevant to the selected action type', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
    const viewOpenInNewTab = findNamedField(actions.fields, 'viewOpenInNewTab')
    const linkType = findNamedField(actions.fields, 'linkType')
    const mode = findNamedField(actions.fields, 'mode')
    const variant = findNamedField(actions.fields, 'variant')
    const showArrow = findNamedField(actions.fields, 'showArrow')

    expect(viewOpenInNewTab?.admin?.condition?.({}, { actionType: 'view' }, {} as never)).toBe(true)
    expect(viewOpenInNewTab?.admin?.condition?.({}, { actionType: 'download' }, {} as never)).toBe(
      false,
    )
    expect(linkType?.admin?.condition?.({}, { actionType: 'custom' }, {} as never)).toBe(true)
    expect(mode?.admin?.condition?.({}, { actionType: 'custom' }, {} as never)).toBe(true)
    expect(
      variant?.admin?.condition?.({}, { actionType: 'custom', mode: 'button' }, {} as never),
    ).toBe(true)
    expect(findNamedField(actions.fields, 'icon')).toBeUndefined()
    expect(showArrow).toMatchObject({
      defaultValue: false,
      label: 'Show Arrow',
      type: 'checkbox',
    })
    expect(
      showArrow?.admin?.condition?.({}, { actionType: 'custom', mode: 'button' }, {} as never),
    ).toBe(true)
    expect(
      showArrow?.admin?.condition?.({}, { actionType: 'custom', mode: 'link' }, {} as never),
    ).toBe(false)
    expect(showArrow?.admin?.condition?.({}, { actionType: 'view' }, {} as never)).toBe(false)
  })

  it('generates Show Arrow without an icon field for current document actions', () => {
    const generatedTypes = readFileSync(join(process.cwd(), 'src/payload-types.ts'), 'utf8')
    const downloadListStart = generatedTypes.indexOf('export interface DownloadListBlock')
    const downloadListEnd = generatedTypes.indexOf(
      'export interface DownloadListBlockSelect',
      downloadListStart,
    )
    const generatedDownloadList = generatedTypes.slice(downloadListStart, downloadListEnd)
    const documentActionsStart = generatedDownloadList.indexOf('documentActions?:')
    const documentActionsEnd = generatedDownloadList.indexOf('customAction?:', documentActionsStart)
    const generatedDocumentActions = generatedDownloadList.slice(
      documentActionsStart,
      documentActionsEnd,
    )

    expect(generatedDocumentActions).toContain('showArrow?: boolean | null')
    expect(generatedDocumentActions).not.toContain('icon?: string | null')
  })

  it('hides every compatibility action control from new authoring', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const currentCustomAction = findNamedField(downloads.fields, 'customAction') as ArrayField
    const legacyActions = findNamedField(downloads.fields, 'actions') as ArrayField
    const automaticFallback = DownloadListBlock.fields
      .flatMap((field) =>
        field.type === 'tabs' ? field.tabs.flatMap((tab) => tab.fields) : [field],
      )
      .find(
        (field): field is CollapsibleField =>
          field.type === 'collapsible' && field.label === 'Automatic Action Fallback',
      )

    expect(currentCustomAction.admin?.hidden).toBe(true)
    expect(legacyActions.admin?.hidden).toBe(true)
    expect(automaticFallback?.admin?.hidden).toBe(true)
    for (const name of ['showViewAction', 'openViewInNewTab', 'showDownloadAction']) {
      const field = findNamedField(DownloadListBlock.fields, name)
      expect(field && 'validate' in field ? field.validate : undefined).toBeUndefined()
    }
  })

  it('validates document action destinations and duplicate choices', () => {
    const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
    const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
    const validate = actions.validate

    expect(typeof validate).toBe('function')
    if (typeof validate !== 'function') return

    expect(validate([{ actionType: 'download' }], { siblingData: { file: null } } as never)).toBe(
      'Download action 1 requires File Upload.',
    )
    expect(
      validate([{ actionType: 'view' }], {
        siblingData: { externalUrl: '', file: null },
      } as never),
    ).toBe('View action 1 requires View URL or File Upload.')
    expect(
      validate([{ actionType: 'download' }, { actionType: 'download' }], {
        siblingData: { file: 'media-id' },
      } as never),
    ).toBe('Add Download only once per document.')
    expect(
      validate(
        [
          { actionType: 'custom', label: 'First', linkType: 'custom', url: '/notice' },
          { actionType: 'custom', label: 'Second', linkType: 'custom', url: ' /notice ' },
        ],
        { siblingData: {} } as never,
      ),
    ).toBe('Custom actions must use different destinations.')
    expect(
      validate(
        [
          { actionType: 'view' },
          {
            actionType: 'custom',
            label: 'Admissions',
            linkType: 'custom',
            mode: 'button',
            url: '/admissions',
          },
        ],
        { siblingData: { externalUrl: '/viewer' } } as never,
      ),
    ).toBe(true)
  })
})

describe('DownloadList action resolution', () => {
  it('resolves manual Link and Download actions in editor order', () => {
    expect(
      resolveDocumentActions({
        legacyActions: [
          {
            actionType: 'link',
            label: ' Read requirements ',
            linkType: 'custom',
            openInNewTab: true,
            url: ' /admissions ',
          },
          { actionType: 'download', file: sharedMedia, label: ' Download form ' },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/admissions',
        kind: 'view',
        label: 'Read requirements',
        mode: 'link',
        openInNewTab: true,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/api/media/file/policy.pdf',
        kind: 'download',
        label: 'Download form',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('keeps only two valid manual actions and lets them replace fallback actions', () => {
    const result = resolveDocumentActions({
      legacyActions: [
        { actionType: 'link', label: 'First', linkType: 'custom', url: '/first' },
        { actionType: 'download', file: sharedMedia, label: 'Second' },
        { actionType: 'link', label: 'Third', linkType: 'custom', url: '/third' },
      ],
      fallback,
    })

    expect(result).toHaveLength(2)
    expect(result.map((action) => action.label)).toEqual(['First', 'Second'])
    expect(result.some((action) => action.href === '/fallback')).toBe(false)
  })

  it('uses fixed automatic actions when no manual row resolves validly', () => {
    expect(
      resolveDocumentActions({
        legacyActions: [
          { actionType: 'link', label: 'Missing URL', linkType: 'custom' },
          { actionType: 'download', label: 'Missing file' },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/fallback',
        kind: 'view',
        label: 'View Document',
        mode: 'link',
        openInNewTab: true,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/api/media/file/fallback.pdf',
        kind: 'download',
        label: 'Download',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('defaults to Download only when behavior settings are missing', () => {
    expect(
      resolveDocumentActions({
        fallback: {
          downloadHref: '/api/media/file/fallback.pdf',
          viewHref: '/fallback',
        },
      }),
    ).toEqual([
      {
        href: '/api/media/file/fallback.pdf',
        kind: 'download',
        label: 'Download',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('ignores historical manual visual settings', () => {
    expect(
      resolveDocumentActions({
        legacyActions: [
          {
            actionAppearance: 'iconOnly',
            actionType: 'link',
            icon: 'Star',
            iconMode: 'custom',
            label: 'Historical link',
            linkType: 'custom',
            url: '/historical',
          },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/historical',
        kind: 'view',
        label: 'Historical link',
        mode: 'link',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('appends one custom action after available automatic actions', () => {
    expect(
      resolveDocumentActions({
        customActions: [
          {
            label: 'Admission details',
            linkType: 'custom',
            mode: 'button',
            openInNewTab: true,
            showArrow: true,
            url: '/admissions',
            variant: 'outline',
          },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/fallback',
        kind: 'view',
        label: 'View Document',
        mode: 'link',
        openInNewTab: true,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/api/media/file/fallback.pdf',
        kind: 'download',
        label: 'Download',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/admissions',
        kind: 'custom',
        label: 'Admission details',
        mode: 'button',
        openInNewTab: true,
        showArrow: true,
        variant: 'outline',
      },
    ])
  })

  it('skips unavailable automatic actions without suppressing a valid custom action', () => {
    const result = resolveDocumentActions({
      customActions: [
        {
          label: 'Open notice',
          linkType: 'custom',
          mode: 'link',
          url: '/notice',
        },
      ],
      fallback: {
        showDownload: true,
        showView: true,
      },
    })

    expect(result.map((action) => action.kind)).toEqual(['custom'])
    expect(result[0]?.href).toBe('/notice')
  })

  it('retains legacy replacement behavior when no custom action resolves', () => {
    const result = resolveDocumentActions({
      legacyActions: [
        { actionType: 'link', label: 'Historical link', linkType: 'custom', url: '/historical' },
      ],
      fallback,
    })

    expect(result).toEqual([
      {
        href: '/historical',
        kind: 'view',
        label: 'Historical link',
        mode: 'link',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('resolves new per-document actions in editor order with built-in defaults', () => {
    expect(
      resolveDocumentActions({
        documentActions: [
          { actionType: 'view', viewOpenInNewTab: false },
          { actionType: 'download', label: 'Save PDF' },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/fallback',
        kind: 'view',
        label: 'View',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/api/media/file/fallback.pdf',
        kind: 'download',
        label: 'Save PDF',
        mode: 'button',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
    ])
  })

  it('resolves Show Arrow only for a Custom Button', () => {
    expect(
      resolveDocumentActions({
        documentActions: [
          {
            actionType: 'custom',
            label: 'Requirements',
            linkType: 'custom',
            mode: 'link',
            showArrow: true,
            url: '/requirements',
          },
          {
            actionType: 'custom',
            label: 'Apply',
            linkType: 'custom',
            mode: 'button',
            openInNewTab: true,
            showArrow: true,
            url: '/apply',
            variant: 'outline',
          },
        ],
        fallback,
      }),
    ).toEqual([
      {
        href: '/requirements',
        kind: 'custom',
        label: 'Requirements',
        mode: 'link',
        openInNewTab: false,
        showArrow: false,
        variant: 'default',
      },
      {
        href: '/apply',
        kind: 'custom',
        label: 'Apply',
        mode: 'button',
        openInNewTab: true,
        showArrow: true,
        variant: 'outline',
      },
    ])

    const [historicalIconAction] = resolveDocumentActions({
      documentActions: [
        {
          actionType: 'custom',
          icon: 'ExternalLink',
          label: 'Apply',
          linkType: 'custom',
          mode: 'button',
          url: '/apply',
        },
      ] as never,
      fallback,
    })

    expect(historicalIconAction).not.toHaveProperty('icon')
    expect(historicalIconAction?.showArrow).toBe(false)
  })

  it('does not expose hidden fallbacks when an authored new list is unusable', () => {
    expect(
      resolveDocumentActions({
        customActions: [{ label: 'Legacy custom', linkType: 'custom', url: '/legacy-custom' }],
        documentActions: [{ actionType: 'download' }],
        fallback: { ...fallback, downloadHref: undefined },
        legacyActions: [
          { actionType: 'link', label: 'Legacy manual', linkType: 'custom', url: '/legacy' },
        ],
      }),
    ).toEqual([])
  })
})

describe('DownloadList rendering', () => {
  it.each([
    ['cards', 'card'],
    ['openGrid', 'openGrid'],
    ['framedGrid', 'framedGrid'],
    ['list', 'inline'],
  ] as const)('renders %s with shared responsive columns', (displayMode, evidence) => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent columns="8" displayMode={displayMode} downloads={documents} />,
    )
    expect(html).toContain(`data-download-presentation="${evidence}"`)
    expect(html).toContain('data-download-grid="true"')
    expect(html).toContain('2xl:grid-cols-8')
  })

  it('normalizes missing and invalid shared Columns to three', () => {
    expect(normalizeGridColumns()).toBe('3')
    expect(normalizeGridColumns('9')).toBe('3')
    expect(normalizeGridColumns('8')).toBe('8')
  })

  it.each(['top', 'center', 'bottom'] as const)(
    'renders a left split introduction aligned to %s',
    (introVerticalAlignment) => {
      const expectedClass = {
        top: 'lg:self-start',
        center: 'lg:self-center',
        bottom: 'lg:self-end',
      }[introVerticalAlignment]
      const html = renderToStaticMarkup(
        <DownloadListBlockComponent
          description="Current notices"
          downloads={documents}
          introPosition="left"
          introVerticalAlignment={introVerticalAlignment}
          sectionLayout="split"
          title="Downloads"
        />,
      )

      expect(html).toContain('data-download-section-layout="split"')
      expect(html).toContain('data-download-intro-position="left"')
      expect(html).toContain(`data-download-intro-vertical-alignment="${introVerticalAlignment}"`)
      expect(html).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
      expect(html).toContain(expectedClass)
    },
  )

  it('keeps introduction first in markup when displayed on the right', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        downloads={documents}
        introPosition="right"
        sectionLayout="split"
        title="Downloads"
      />,
    )

    expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
    expect(html).toContain('data-download-intro-position="right"')
    expect(html.indexOf('data-download-intro="true"')).toBeLessThan(
      html.indexOf('data-download-collection="true"'),
    )
    expect(html).toContain('lg:col-start-2 lg:row-start-1')
    expect(html).toContain('lg:col-start-1 lg:row-start-1')
  })

  it('uses full width when split is selected without introduction content', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent downloads={documents} sectionLayout="split" />,
    )

    expect(html).toContain('data-download-section-layout="stacked"')
    expect(html).not.toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
    expect(html).not.toContain('data-download-intro="true"')
  })

  it('renders ordered per-document buttons with labels and fixed icons in labelled grids', () => {
    render(
      <DownloadListBlockComponent
        displayMode="cards"
        downloads={[
          {
            documentActions: [
              { actionType: 'view', label: 'Preview' },
              { actionType: 'download', label: 'Save PDF' },
            ],
            externalUrl: '/preview',
            file: sharedMedia,
            title: 'Policy',
          },
        ]}
      />,
    )

    const actions = screen.getAllByRole('link')
    expect(actions.map((action) => action.textContent)).toEqual(['Preview', 'Save PDF'])
    expect(actions[0]?.querySelector('[data-document-action-icon="eye"]')).toBeTruthy()
    expect(actions[1]?.querySelector('[data-document-action-icon="arrow-down"]')).toBeTruthy()
  })

  it('renders Custom Link as text and Custom Button with an optional shared arrow', () => {
    render(
      <DownloadListBlockComponent
        displayMode="framedGrid"
        downloads={[
          {
            documentActions: [
              {
                actionType: 'custom',
                label: 'Requirements',
                linkType: 'custom',
                mode: 'link',
                url: '/requirements',
              },
              {
                actionType: 'custom',
                label: 'Apply',
                linkType: 'custom',
                mode: 'button',
                showArrow: true,
                url: '/apply',
              },
            ],
            title: 'Admissions',
          },
        ]}
      />,
    )

    const link = screen.getByRole('link', { name: 'Requirements' })
    const button = screen.getByRole('link', { name: 'Apply' })
    expect(link.className).toContain('underline-offset-4')
    expect(link.querySelector('[data-action-arrow="true"]')).toBeNull()
    expect(button.textContent).toBe('Apply')
    expect(button.querySelector('[data-action-arrow="true"]')).toBeTruthy()
  })

  it('renders labelled custom links and buttons with configured presentation', () => {
    render(
      <DownloadListBlockComponent
        displayMode="cards"
        downloads={[
          {
            customAction: [
              {
                label: 'Admissions',
                linkType: 'custom',
                mode: 'button',
                showArrow: true,
                url: '/admissions',
                variant: 'outline',
              },
            ],
            file: sharedMedia,
            title: 'Policy',
          },
        ]}
        showViewAction
      />,
    )

    expect(screen.getByRole('link', { name: 'View Document' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Download' })).toBeTruthy()
    const custom = screen.getByRole('link', { name: 'Admissions' })
    expect(custom.getAttribute('data-document-action')).toBe('custom')
    expect(custom.className).toContain('border')
    expect(custom.querySelector('[data-action-arrow="true"]')).toBeTruthy()
  })

  it('renders a labelled custom Link without button styling', () => {
    render(
      <DownloadListBlockComponent
        displayMode="cards"
        downloads={[
          {
            customAction: [
              { label: 'Admissions', linkType: 'custom', mode: 'link', url: '/admissions' },
            ],
            title: 'Policy',
          },
        ]}
      />,
    )

    const custom = screen.getByRole('link', { name: 'Admissions' })
    expect(custom.getAttribute('data-document-action')).toBe('custom')
    expect(custom.className).toContain('underline-offset-4')
    expect(custom.className).not.toContain('bg-primary')
  })

  it.each([
    ['list', 'labelled'],
    ['openGrid', 'icons'],
  ] as const)(
    'keeps Custom Link textual while compacting buttons in %s',
    (displayMode, display) => {
      render(
        <DownloadListBlockComponent
          displayMode={displayMode}
          downloads={[
            {
              documentActions: [
                {
                  actionType: 'custom',
                  label: 'Requirements',
                  linkType: 'custom',
                  mode: 'link',
                  url: '/requirements',
                },
                { actionType: 'view' },
              ],
              externalUrl: '/preview',
              title: 'Policy',
            },
          ]}
          gridActionDisplay={display}
        />,
      )

      const textLink = screen.getByRole('link', { name: 'Requirements' })
      const viewButton = screen.getByRole('link', { name: 'View' })
      expect(textLink.getAttribute('title')).toBeNull()
      expect(textLink.textContent).toBe('Requirements')
      expect(textLink.querySelector('svg')).toBeNull()
      expect(viewButton.getAttribute('title')).toBe('View')
      expect(viewButton.textContent).toBe('')
      expect(viewButton.querySelector('[data-document-action-icon="eye"]')).toBeTruthy()
    },
  )

  it.each([
    ['cards', 'icons'],
    ['list', 'labelled'],
  ] as const)('keeps Custom Button labels visible in %s', (displayMode, gridActionDisplay) => {
    render(
      <DownloadListBlockComponent
        displayMode={displayMode}
        downloads={[
          {
            documentActions: [
              {
                actionType: 'custom',
                label: 'Apply',
                linkType: 'custom',
                mode: 'button',
                url: '/apply',
              },
            ],
            title: 'Admissions',
          },
        ]}
        gridActionDisplay={gridActionDisplay}
      />,
    )

    const button = screen.getByRole('link', { name: 'Apply' })
    expect(button.textContent).toBe('Apply')
    expect(button.getAttribute('title')).toBeNull()
    expect(button.querySelector('[data-document-action-label="true"]')).toBeTruthy()
    expect(button.querySelector('[data-action-arrow="true"]')).toBeNull()
  })

  it('applies shared Columns to the legacy compact Inline fallback', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent columns="2" displayMode="compact" downloads={documents} />,
    )

    expect(html).toContain('data-download-presentation="inline"')
    expect(html).toContain('data-download-inline-columns="2"')
    expect(html).toContain('sm:grid-cols-2')
  })

  it('gives Open Grid horizontal outer rules and Framed Grid one square frame', () => {
    const open = renderToStaticMarkup(
      <DownloadListBlockComponent displayMode="openGrid" downloads={documents} />,
    )
    const framed = renderToStaticMarkup(
      <DownloadListBlockComponent displayMode="framedGrid" downloads={documents} />,
    )
    const openFrame = open.match(/class="([^"]*)" data-download-grid-frame="open"/)?.[1]
    const framedFrame = framed.match(/class="([^"]*)" data-download-grid-frame="framed"/)?.[1]

    expect(openFrame).toContain('border-y')
    expect(openFrame?.split(' ')).not.toContain('border')
    expect(open).not.toContain('data-download-grid-outer-border="true"')
    expect(framedFrame?.split(' ')).toContain('border')
    expect(framedFrame).toContain('rounded-none')
    expect(framed.match(/data-download-grid-outer-border="true"/g)).toHaveLength(1)
  })

  it('renders fixed accessible icon-only actions in Inline', () => {
    render(
      <DownloadListBlockComponent
        displayMode="list"
        downloads={documents}
        gridActionDisplay="labelled"
        showViewAction
      />,
    )

    expect(screen.getByRole('link', { name: 'View Document' }).getAttribute('title')).toBe(
      'View Document',
    )
    expect(screen.getByRole('link', { name: 'Download' }).getAttribute('title')).toBe('Download')
    expect(screen.getByTestId('download-action-eye')).toBeTruthy()
    expect(screen.getByTestId('download-action-arrow-down')).toBeTruthy()
    expect(screen.queryByText('PDF')).toBeNull()
    expect(document.querySelector('[data-document-action-label="true"]')).toBeNull()
    expect(document.querySelector('[data-document-actions-display="icons"]')).toBeTruthy()
  })

  it.each(['cards', 'openGrid', 'framedGrid'] as const)(
    'renders fixed labelled actions without a divider in %s',
    (displayMode) => {
      const html = renderToStaticMarkup(
        <DownloadListBlockComponent
          displayMode={displayMode}
          downloads={documents}
          showViewAction
        />,
      )

      expect(html).toContain('data-document-actions-layout="grid"')
      expect(html).toContain('data-document-action-label="true">View Document')
      expect(html).toContain('data-document-action-label="true">Download')
      expect(html).toContain('underline-offset-4')
      expect(html).toContain('data-document-action-icon="arrow-down"')
      expect(html).not.toContain('data-download-item-action-divider')
    },
  )

  it('renders automatic grid actions as accessible icons when selected', () => {
    render(
      <DownloadListBlockComponent
        displayMode="framedGrid"
        downloads={documents}
        gridActionDisplay="icons"
        showViewAction
      />,
    )

    const view = screen.getByRole('link', { name: 'View Document' })
    const download = screen.getByRole('link', { name: 'Download' })

    expect(view.getAttribute('title')).toBe('View Document')
    expect(view.getAttribute('target')).toBe('_blank')
    expect(view.getAttribute('rel')).toBe('noreferrer')
    expect(download.getAttribute('title')).toBe('Download')
    expect(download.hasAttribute('download')).toBe(true)
    expect(screen.getByTestId('download-action-eye')).toBeTruthy()
    expect(screen.getByTestId('download-action-arrow-down')).toBeTruthy()
    expect(document.querySelector('[data-document-action-label="true"]')).toBeNull()
    expect(document.querySelector('[data-document-actions-display="icons"]')).toBeTruthy()
    expect(download.outerHTML).toContain('group-hover/button:translate-y')
    expect(download.outerHTML).toContain('group-focus-visible/button:translate-y')
    expect(download.outerHTML).toContain('motion-reduce:transition-none')
  })

  it('uses manual action labels as accessible names for grid icons', () => {
    render(
      <DownloadListBlockComponent
        displayMode="openGrid"
        downloads={[
          {
            actions: [
              {
                actionType: 'link',
                label: 'Open policy',
                linkType: 'custom',
                openInNewTab: true,
                url: '/policy',
              },
              { actionType: 'download', file: sharedMedia, label: 'Save policy' },
            ],
            title: 'Policy',
          },
        ]}
        gridActionDisplay="icons"
      />,
    )

    expect(screen.getByRole('link', { name: 'Open policy' }).getAttribute('title')).toBe(
      'Open policy',
    )
    expect(screen.getByRole('link', { name: 'Save policy' }).getAttribute('title')).toBe(
      'Save policy',
    )
    expect(document.querySelector('[data-document-action-label="true"]')).toBeNull()
  })

  it('keeps labelled grid actions for missing or invalid display values', () => {
    const missing = renderToStaticMarkup(
      <DownloadListBlockComponent displayMode="cards" downloads={documents} showViewAction />,
    )
    const invalid = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="cards"
        downloads={documents}
        gridActionDisplay={'invalid' as never}
        showViewAction
      />,
    )

    for (const html of [missing, invalid]) {
      expect(html).toContain('data-document-actions-display="labelled"')
      expect(html).toContain('data-document-action-label="true">View Document')
      expect(html).toContain('data-document-action-label="true">Download')
    }
  })

  it('uses a vertical Inline divider with actions fixed on the right', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent displayMode="list" downloads={documents} showViewAction />,
    )

    expect(html).toContain('data-download-inline-item-container="true"')
    expect(html).toContain('data-download-item-action-divider="true"')
    expect(html).toContain('grid h-full min-w-0 items-start gap-4 p-5')
    expect(html).toContain('grid-cols-[auto_minmax(0,1fr)_auto_auto]')
    expect(html).toContain('self-stretch border-l border-current/15')
    expect(html).toContain('self-center')
    expect(html).toContain('data-document-actions-layout="inline"')
    expect(html).not.toContain('@container/download-item')
    expect(html).not.toContain('@xl/download-item:')
    expect(html).not.toContain('col-span-full border-t')
    expect(html).not.toContain('data-document-action-label="true"')
    expect(html).not.toContain('data-document-file-type="true"')
  })

  it.each(['cards', 'openGrid', 'framedGrid', 'list'] as const)(
    'hides the document icon in %s when disabled',
    (displayMode) => {
      const html = renderToStaticMarkup(
        <DownloadListBlockComponent
          displayMode={displayMode}
          downloads={documents}
          showDocumentIcon={false}
        />,
      )
      expect(html).not.toContain('data-testid="download-document-icon"')
    },
  )

  it('removes the unused Inline icon column when the file icon is hidden', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="list"
        downloads={documents}
        showDocumentIcon={false}
      />,
    )

    expect(html).toContain('grid-cols-[minmax(0,1fr)_auto_auto]')
    expect(html).not.toContain('grid-cols-[auto_minmax(0,1fr)_auto_auto]')
  })

  it('keeps the boxed-family PDF badge top-right for both icon positions', () => {
    for (const displayMode of ['cards', 'openGrid', 'framedGrid'] as const) {
      for (const gridIconPosition of ['above', 'inline'] as const) {
        const html = renderToStaticMarkup(
          <DownloadListBlockComponent
            displayMode={displayMode}
            downloads={documents}
            gridIconPosition={gridIconPosition}
          />,
        )

        expect(html.match(/data-document-file-type="true"/g)).toHaveLength(1)
        expect(html).toContain('data-download-grid-badge-slot="true"')
        expect(html.indexOf('data-document-file-type="true"')).toBeLessThan(
          html.indexOf('data-document-title="true"'),
        )
      }
    }
  })

  it.each([
    ['small', 'size-8', 'size-4'],
    ['medium', 'size-10', 'size-5'],
    ['large', 'size-12', 'size-6'],
  ] as const)('renders %s document icons', (documentIconSize, containerClass, iconClass) => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent documentIconSize={documentIconSize} downloads={documents} />,
    )
    expect(html).toContain(`data-document-icon-size="${documentIconSize}"`)
    expect(html).toContain(containerClass)
    expect(html).toContain(iconClass)
  })

  it.each([
    ['application/pdf', 'PDF'],
    ['application/msword', 'DOC'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX'],
    ['application/vnd.ms-excel', 'XLS'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'XLSX'],
    ['text/csv', 'CSV'],
    ['application/vnd.ms-powerpoint', 'PPT'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PPTX'],
    ['application/zip', 'ZIP'],
    ['image/png', 'PNG'],
  ] as const)('detects %s as %s', (mimeType, expected) => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="framedGrid"
        downloads={[
          {
            file: {
              id: mimeType,
              mimeType,
              url: `/files/${expected.toLowerCase()}`,
            } as unknown as Media,
            title: expected,
          },
        ]}
      />,
    )

    expect(html).toContain(`data-document-file-type="true">${expected}`)
  })

  it('keeps historical explicit file-type values readable', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="framedGrid"
        downloads={[{ file: sharedMedia, fileType: 'odt', title: 'Historical document' }]}
      />,
    )

    expect(html).toContain('data-document-file-type="true">ODT')
  })

  it('resolves uploaded files independently for View and Download', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        downloads={[
          { externalUrl: 'https://viewer.example/policy', file: sharedMedia, title: 'Policy' },
        ]}
        showViewAction
      />,
    )
    expect(html).toContain('href="https://viewer.example/policy"')
    expect(html).toContain('href="/api/media/file/policy.pdf"')
    expect(html).toContain('download=""')
    expect(html).toContain('group-hover/button:translate-y')
    expect(html).toContain('group-focus-visible/button:translate-y')
    expect(html).toContain('motion-reduce:transition-none')
  })

  it('omits Download for URL-only documents and unresolved rows', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        downloads={[{ externalUrl: '/policy', title: 'Policy' }, { title: 'Missing destination' }]}
        showViewAction
      />,
    )
    expect(html).toContain('Policy')
    expect(html).not.toContain('Missing destination')
    expect(html).not.toContain('data-document-action="download"')
  })

  it('renders manual labels but lets the presentation own their visual treatment', () => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="framedGrid"
        downloads={[
          {
            actions: [
              {
                actionAppearance: 'iconOnly',
                actionType: 'link',
                icon: 'Star',
                iconMode: 'custom',
                label: 'Open policy',
                linkType: 'custom',
                url: '/policy',
              },
              { actionType: 'download', file: sharedMedia, label: 'Download policy' },
            ],
            title: 'Policy',
          },
        ]}
      />,
    )

    expect(html).toContain('data-document-action-label="true">Open policy')
    expect(html).toContain('data-document-action-label="true">Download policy')
    expect(html).not.toContain('data-document-action-icon="star"')
    expect(html).toContain('data-document-action-icon="arrow-down"')
  })

  it('contains no category filtering or category presentation markup', () => {
    const client = readFileSync(
      join(process.cwd(), 'src/blocks/DownloadList/DownloadListClient.tsx'),
      'utf8',
    )
    const presentation = readFileSync(
      join(process.cwd(), 'src/blocks/DownloadList/Presentation.tsx'),
      'utf8',
    )

    expect(client).not.toContain('showFilter')
    expect(client).not.toContain('activeCategory')
    expect(client).not.toContain('data-download-filters')
    expect(presentation).not.toContain('document.category')
  })
})

describe('DownloadList thumbnail fixture', () => {
  it('demonstrates the framed grid, inline icon position, and automatic downloads', () => {
    const source = readFileSync(join(process.cwd(), 'src/block-thumbnails/fixtures.tsx'), 'utf8')
    const fixture = source.slice(source.indexOf('downloadList:'), source.indexOf('iconGrid:'))

    expect(fixture).toContain('displayMode="framedGrid"')
    expect(fixture).toContain('documentIconSize="medium"')
    expect(fixture).toContain('gridActionDisplay="labelled"')
    expect(fixture).toContain('gridIconPosition="inline"')
    expect(fixture).toContain('showDocumentIcon')
    expect(fixture).not.toContain('category:')
    expect(fixture).toContain("fileType: 'PDF'")
    expect(fixture).not.toContain("actionType: 'link'")
    expect(fixture).not.toContain("actionType: 'download'")
  })
})

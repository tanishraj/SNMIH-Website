import { describe, expect, it } from 'vitest'
import {
  resolveFeeDocumentActions,
  resolveFeeDocumentPanel,
} from '@/blocks/shared/feeDocumentAction'
import {
  createFeeDocumentActionField,
  hasFeeDocumentAction,
} from '@/blocks/shared/feeDocumentActionFields'
import type { Media } from '@/payload-types'
const media = { id: 'fees', url: '/media/fees.pdf' } as Media
const legacy = {
  feeDocument: media,
  downloadLabel: 'Published fees',
  downloadActionMode: 'link',
  downloadButtonVariant: 'whiteOutline',
} as const

describe('shared fee document action', () => {
  it('provides the canonical single File action with View and Download behavior', () => {
    const field = createFeeDocumentActionField()
    expect(field.maxRows).toBe(1)
    const tabs = field.fields[0]
    if (tabs.type !== 'tabs') throw Error('Expected action tabs')
    const fields = tabs.tabs.flatMap((t) => t.fields)
    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'fileBehavior',
          options: [
            { label: 'View', value: 'view' },
            { label: 'Download', value: 'download' },
          ],
        }),
        expect.objectContaining({
          name: 'linkType',
          defaultValue: 'file',
          options: [{ label: 'File', value: 'file' }],
        }),
        expect.objectContaining({ name: 'openFileInNewTab' }),
      ]),
    )
  })
  it('preserves legacy file, label, style, mode, and download behavior', () => {
    expect(resolveFeeDocumentActions(legacy)[0]).toMatchObject({
      file: media,
      label: 'Published fees',
      mode: 'link',
      variant: 'whiteOutline',
      fileBehavior: 'download',
    })
    expect(resolveFeeDocumentPanel(legacy)?.action).toMatchObject({
      href: '/media/fees.pdf',
      download: true,
      openInNewTab: false,
    })
  })
  it('respects explicit clearing and incomplete actions instead of returning the legacy file', () => {
    for (const feeDocumentAction of [
      [],
      null,
      [{ label: 'Missing file', linkType: 'file' as const }],
    ]) {
      expect(resolveFeeDocumentPanel({ ...legacy, feeDocumentAction })).toBeUndefined()
    }
    expect(hasFeeDocumentAction({}, { ...legacy, feeDocumentAction: [] })).toBe(false)
  })
  it('supports same-tab viewing and rejects non-file destinations', () => {
    expect(
      resolveFeeDocumentPanel({
        feeDocumentAction: [
          {
            label: 'View fees',
            linkType: 'file',
            file: media,
            fileBehavior: 'view',
            openFileInNewTab: false,
          },
        ],
      })?.action,
    ).toMatchObject({ openInNewTab: false, download: undefined })
    expect(
      resolveFeeDocumentPanel({
        feeDocumentAction: [{ label: 'Other', linkType: 'custom', url: '/other' }],
      }),
    ).toBeUndefined()
  })
})

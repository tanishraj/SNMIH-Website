import type { BlockAppearance } from './blockAppearance'
import {
  resolveCmsActions,
  type CmsActionValue,
  type CmsActionVariant,
  type ResolvedCmsAction,
} from '@/lib/cmsLinks'

export type FeeDocumentDownloadActionMode = 'button' | 'link'
export type FeeDocumentDownloadButtonVariant = Exclude<CmsActionVariant, 'link'>
export type FeeDocumentActionValue = {
  feeDocumentAction?: CmsActionValue[] | null
  feeDocument?: CmsActionValue['file']
  downloadLabel?: string | null
  downloadActionMode?: FeeDocumentDownloadActionMode | null
  downloadButtonVariant?: FeeDocumentDownloadButtonVariant | null
}
export type ResolvedFeeDocumentDownload = {
  action: ResolvedCmsAction
  appearance?: BlockAppearance | null
  sectionBackground?: BlockAppearance['background'] | null
}
const variants = new Set<CmsActionVariant>([
  'default',
  'primary',
  'secondary',
  'outline',
  'white',
  'whiteOutline',
])
export const resolveFeeDocumentButtonVariant = (
  value?: FeeDocumentDownloadButtonVariant | null,
): FeeDocumentDownloadButtonVariant =>
  variants.has(value as CmsActionVariant) ? (value as FeeDocumentDownloadButtonVariant) : 'outline'

export function resolveFeeDocumentActions(value: FeeDocumentActionValue): CmsActionValue[] {
  // Clearing the new action must not restore the legacy document on the next read.
  if (value.feeDocumentAction !== undefined) return value.feeDocumentAction ?? []
  if (!value.feeDocument) return []
  return [
    {
      label: value.downloadLabel?.trim() || 'Download Fee Structure',
      linkType: 'file',
      file: value.feeDocument,
      fileBehavior: 'download',
      mode: value.downloadActionMode === 'link' ? 'link' : 'button',
      variant: resolveFeeDocumentButtonVariant(value.downloadButtonVariant),
      showFileIcon: true,
      fileIconPosition: value.downloadActionMode === 'link' ? 'right' : 'left',
    },
  ]
}
export function resolveFeeDocumentPanel(
  value: FeeDocumentActionValue & {
    downloadAppearance?: BlockAppearance | null
    sectionBackground?: BlockAppearance['background'] | null
  },
): ResolvedFeeDocumentDownload | undefined {
  const input = resolveFeeDocumentActions(value)[0]
  if (!input || input.linkType !== 'file') return undefined
  const action = resolveCmsActions([input], 'button')[0]
  if (!action) return undefined
  return {
    action,
    appearance: value.downloadAppearance,
    sectionBackground: value.sectionBackground,
  }
}

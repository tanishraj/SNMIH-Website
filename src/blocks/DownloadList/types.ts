import type { CmsActionMode, CmsActionVariant } from '@/lib/cmsLinks'

export type DownloadDisplayMode = 'cards' | 'compact' | 'framedGrid' | 'list' | 'openGrid'

export type DownloadGridColumns = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export type DownloadDocumentIconSize = 'large' | 'medium' | 'small'

export type DownloadActionKind = 'custom' | 'download' | 'view'

export type DownloadSectionLayout = 'split' | 'stacked'

export type DownloadIntroPosition = 'left' | 'right'

export type DownloadIntroVerticalAlignment = 'bottom' | 'center' | 'top'

export type DownloadGridIconPosition = 'above' | 'inline'

export type DownloadGridActionDisplay = 'icons' | 'labelled'

export type DownloadActionSettings = {
  openViewInNewTab?: boolean | null
  showDownload?: boolean | null
  showView?: boolean | null
}

export type ResolvedDownloadAction = {
  href: string
  kind: DownloadActionKind
  label: string
  mode: CmsActionMode
  openInNewTab: boolean
  showArrow: boolean
  variant: CmsActionVariant
}

export type ResolvedDownload = {
  actions: ResolvedDownloadAction[]
  cardBackground?: string
  description?: string
  fileType?: string
  id: string | number
  title: string
}

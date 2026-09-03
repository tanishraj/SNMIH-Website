'use client'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'

import { DownloadListPresentation, normalizeGridColumns } from './Presentation'
import type {
  DownloadDisplayMode,
  DownloadDocumentIconSize,
  DownloadGridActionDisplay,
  DownloadGridColumns,
  DownloadGridIconPosition,
  ResolvedDownload,
} from './types'

type Props = {
  columns?: DownloadGridColumns | null
  displayMode?: DownloadDisplayMode | null
  documentIconSize?: DownloadDocumentIconSize | null
  downloads: ResolvedDownload[]
  gridActionDisplay?: DownloadGridActionDisplay | null
  gridIconPosition?: DownloadGridIconPosition | null
  sectionBackground: BlockBackground
  showDocumentIcon?: boolean | null
}

const displayModes = new Set<DownloadDisplayMode>(['cards', 'framedGrid', 'list', 'openGrid'])

export function DownloadListClient({
  columns = '3',
  displayMode = 'list',
  documentIconSize = 'medium',
  downloads,
  gridActionDisplay = 'labelled',
  gridIconPosition = 'above',
  sectionBackground,
  showDocumentIcon = true,
}: Props) {
  const resolvedDisplayMode = displayMode && displayModes.has(displayMode) ? displayMode : 'list'

  return (
    <div className="flex flex-col gap-6">
      <DownloadListPresentation
        columns={normalizeGridColumns(columns)}
        displayMode={resolvedDisplayMode}
        documentIconSize={documentIconSize ?? 'medium'}
        downloads={downloads}
        gridActionDisplay={gridActionDisplay === 'icons' ? 'icons' : 'labelled'}
        gridIconPosition={gridIconPosition === 'inline' ? 'inline' : 'above'}
        sectionBackground={sectionBackground}
        showDocumentIcon={showDocumentIcon ?? true}
      />
    </div>
  )
}

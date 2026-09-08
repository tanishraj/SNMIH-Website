import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockMobilePaddingClasses,
  regularBlockContainerClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaAbsoluteUrl, getMediaDownloadUrl, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'
import { DownloadListClient } from './DownloadListClient'
import {
  resolveDocumentActions,
  type DownloadDocumentActionInput,
  type DownloadManualActionInput,
} from './resolveActions'
import type {
  DownloadDisplayMode,
  DownloadDocumentIconSize,
  DownloadGridActionDisplay,
  DownloadGridColumns,
  DownloadGridIconPosition,
  DownloadIntroPosition,
  DownloadIntroVerticalAlignment,
  DownloadSectionLayout,
  ResolvedDownload,
} from './types'

type DownloadItem = {
  actions?: DownloadManualActionInput[] | null
  cardBackground?: string | null
  customAction?: CmsActionValue[] | null
  description?: string | null
  documentActions?: DownloadDocumentActionInput[] | null
  externalUrl?: string | null
  file?: string | number | Media | null
  fileType?: string | null
  id?: string | null
  title?: string | null
}

type DownloadListBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: DownloadGridColumns | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  documentIconSize?: DownloadDocumentIconSize | null
  displayMode?: DownloadDisplayMode | null
  downloads?: DownloadItem[] | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  gridActionDisplay?: DownloadGridActionDisplay | null
  gridIconPosition?: DownloadGridIconPosition | null
  introPosition?: DownloadIntroPosition | null
  introVerticalAlignment?: DownloadIntroVerticalAlignment | null
  openViewInNewTab?: boolean | null
  sectionLayout?: DownloadSectionLayout | null
  showDownloadAction?: boolean | null
  showDocumentIcon?: boolean | null
  showViewAction?: boolean | null
  size?: RegularBlockSize | null
  title?: string | null
}

const fileTypeByMime: Record<string, string> = {
  'application/msword': 'DOC',
  'application/pdf': 'PDF',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/x-zip-compressed': 'ZIP',
  'application/zip': 'ZIP',
  'text/csv': 'CSV',
}

const splitIntroVerticalAlignmentClasses: Record<DownloadIntroVerticalAlignment, string> = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
}

function detectFileType(item: DownloadItem): string | undefined {
  if (item.fileType?.trim()) return item.fileType.trim().toUpperCase()
  if (isMediaDoc(item.file) && item.file.mimeType) {
    const mime = item.file.mimeType.toLowerCase()
    if (fileTypeByMime[mime]) return fileTypeByMime[mime]
    if (mime.startsWith('image/')) return mime.split('/')[1]?.toUpperCase()
  }
  return undefined
}

export function DownloadListBlockComponent({
  accentTitle,
  actions,
  appearance,
  columns = '3',
  contentAlignment = 'left',
  description,
  documentIconSize = 'medium',
  displayMode = 'list',
  downloads,
  eyebrow,
  footerActions,
  gridActionDisplay = 'labelled',
  gridIconPosition = 'above',
  introPosition = 'left',
  introVerticalAlignment = 'top',
  openViewInNewTab = true,
  sectionLayout = 'stacked',
  showDownloadAction = true,
  showDocumentIcon = true,
  showViewAction = false,
  size = 'default',
  title,
}: DownloadListBlockLike) {
  const validDownloads = (downloads ?? []).filter((d) => d.title?.trim())
  if (validDownloads.length === 0) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const isCenter = (contentAlignment ?? 'left') === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const resolvedSectionLayout = sectionLayout === 'split' ? 'split' : 'stacked'
  const resolvedIntroPosition = introPosition === 'right' ? 'right' : 'left'
  const resolvedIntroVerticalAlignment: DownloadIntroVerticalAlignment =
    introVerticalAlignment === 'center' || introVerticalAlignment === 'bottom'
      ? introVerticalAlignment
      : 'top'
  const hasIntroduction = Boolean(
    eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length > 0,
  )
  const usesSplitSection = resolvedSectionLayout === 'split' && hasIntroduction

  const resolvedDownloads: ResolvedDownload[] = validDownloads.flatMap((item, index) => {
    const fileUrl = isMediaDoc(item.file) ? getMediaAbsoluteUrl(item.file) : undefined
    const externalViewUrl = item.externalUrl?.trim() || undefined
    const viewHref = externalViewUrl ?? fileUrl
    const downloadHref = getMediaDownloadUrl(item.file)
    const documentActions = resolveDocumentActions({
      customActions: item.customAction,
      documentActions: item.documentActions,
      fallback: {
        downloadHref,
        openViewInNewTab: openViewInNewTab ?? true,
        showDownload: showDownloadAction ?? true,
        showView: showViewAction ?? false,
        viewHref,
      },
      legacyActions: item.actions,
    })
    if (documentActions.length === 0) return []

    return [
      {
        actions: documentActions,
        id: item.id ?? index,
        title: item.title!.trim(),
        description: item.description?.trim() || undefined,
        cardBackground: item.cardBackground ?? undefined,
        fileType: detectFileType(item),
      },
    ]
  })

  if (resolvedDownloads.length === 0) return null

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10 md:gap-12')}>
        <div
          className={cn(
            'grid gap-10 md:gap-12',
            usesSplitSection &&
              resolvedIntroPosition === 'left' &&
              'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-16',
            usesSplitSection &&
              resolvedIntroPosition === 'right' &&
              'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-16',
          )}
          data-download-intro-position={resolvedIntroPosition}
          data-download-section-layout={usesSplitSection ? 'split' : 'stacked'}
        >
          {hasIntroduction ? (
            <div
              className={cn(
                'flex max-w-3xl flex-col gap-4',
                isCenter ? 'mx-auto items-center text-center' : 'items-start text-left',
                usesSplitSection &&
                  resolvedIntroPosition === 'right' &&
                  'lg:col-start-2 lg:row-start-1',
                usesSplitSection &&
                  splitIntroVerticalAlignmentClasses[resolvedIntroVerticalAlignment],
              )}
              data-download-intro="true"
              data-download-intro-vertical-alignment={resolvedIntroVerticalAlignment}
            >
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={appearance?.background ?? 'none'}>
                  {eyebrow.trim()}
                </SectionEyebrow>
              ) : null}
              {title?.trim() ? (
                <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                  {resolvedAccentTitle ? (
                    <>
                      <span className="block font-[inherit]">{title.trim()}</span>
                      <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                    </>
                  ) : (
                    title.trim()
                  )}
                </h2>
              ) : null}
              {description?.trim() ? (
                <p className="text-base leading-7 text-current/70">{description.trim()}</p>
              ) : null}
              {resolvedActions.length > 0 ? (
                <div className="mt-2">
                  <ContentActions actions={resolvedActions} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className={cn(
              'min-w-0',
              usesSplitSection &&
                resolvedIntroPosition === 'right' &&
                'lg:col-start-1 lg:row-start-1',
            )}
            data-download-collection="true"
          >
            <DownloadListClient
              columns={columns ?? '3'}
              documentIconSize={documentIconSize ?? 'medium'}
              downloads={resolvedDownloads}
              displayMode={displayMode}
              gridActionDisplay={gridActionDisplay ?? 'labelled'}
              gridIconPosition={gridIconPosition ?? 'above'}
              sectionBackground={appearance?.background ?? 'none'}
              showDocumentIcon={showDocumentIcon ?? true}
            />
          </div>
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}

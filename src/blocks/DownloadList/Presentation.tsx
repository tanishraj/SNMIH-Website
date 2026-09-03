import { ArrowDown, Eye, File, FileImage, FileSpreadsheet, FileText } from 'lucide-react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'
import { ActionArrow } from '@/components/ActionArrow'
import { buttonVariants } from '@/components/ui/button'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

import type {
  DownloadDisplayMode,
  DownloadDocumentIconSize,
  DownloadGridActionDisplay,
  DownloadGridColumns,
  DownloadGridIconPosition,
  ResolvedDownload,
  ResolvedDownloadAction,
} from './types'

type PresentationProps = {
  columns: DownloadGridColumns
  displayMode: DownloadDisplayMode
  documentIconSize: DownloadDocumentIconSize
  downloads: ResolvedDownload[]
  gridActionDisplay: DownloadGridActionDisplay
  gridIconPosition: DownloadGridIconPosition
  sectionBackground: BlockBackground
  showDocumentIcon: boolean
}

type DocumentActionsProps = {
  buttonClassNames?: Partial<Record<CmsActionVariant, string>>
  className?: string
  display: DownloadGridActionDisplay
  document: ResolvedDownload
  layout: 'grid' | 'inline'
  linkClassName?: string
}

const fileIconMap: Record<string, typeof File> = {
  CSV: FileSpreadsheet,
  JPEG: FileImage,
  JPG: FileImage,
  PDF: FileText,
  PNG: FileImage,
  SVG: FileImage,
  XLS: FileSpreadsheet,
  XLSX: FileSpreadsheet,
}

const gridColumnClasses: Record<DownloadGridColumns, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5',
  '6': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6',
  '7': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7',
  '8': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8',
}

const documentIconClasses: Record<DownloadDocumentIconSize, { container: string; icon: string }> = {
  small: { container: 'size-8', icon: 'size-4' },
  medium: { container: 'size-10', icon: 'size-5' },
  large: { container: 'size-12', icon: 'size-6' },
}

export function normalizeGridColumns(value?: string | null): DownloadGridColumns {
  return value && value in gridColumnClasses ? (value as DownloadGridColumns) : '3'
}

function AnimatedDownloadIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex size-4 shrink-0 overflow-hidden"
      data-document-action-icon="arrow-down"
      data-icon="inline-end"
      data-testid="download-action-arrow-down"
    >
      <ArrowDown
        className="absolute left-0 top-0 size-4 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-1 group-hover/button:opacity-0 group-focus-visible/button:translate-y-1 group-focus-visible/button:opacity-0"
        strokeWidth={2.5}
      />
      <ArrowDown
        className="absolute left-0 top-0 size-4 -translate-y-[70%] opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-0 group-hover/button:opacity-100 group-focus-visible/button:translate-y-0 group-focus-visible/button:opacity-100"
        strokeWidth={2.5}
      />
    </span>
  )
}

function DocumentActionIcon({ action }: { action: ResolvedDownloadAction }) {
  if (action.kind === 'download') return <AnimatedDownloadIcon />

  if (action.kind === 'view') {
    return (
      <Eye
        aria-hidden="true"
        className="size-4"
        data-document-action-icon="eye"
        data-testid="download-action-eye"
        strokeWidth={2.25}
      />
    )
  }

  return null
}

function FileTypeIcon({ size, type }: { size: DownloadDocumentIconSize; type?: string }) {
  const Icon = fileIconMap[type?.toUpperCase() ?? ''] ?? FileText
  return <Icon aria-hidden="true" className={cn('shrink-0', documentIconClasses[size].icon)} />
}

function DocumentIcon({
  className,
  size,
  type,
}: {
  className?: string
  size: DownloadDocumentIconSize
  type?: string
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-compact bg-current/10',
        documentIconClasses[size].container,
        className,
      )}
      data-document-icon-size={size}
      data-testid="download-document-icon"
    >
      <FileTypeIcon size={size} type={type} />
    </span>
  )
}

function FileTypeBadge({ surface, type }: { surface?: CardSurfaceClasses; type?: string }) {
  if (!type) return null
  return (
    <span
      className={cn(
        'inline-flex w-fit rounded-compact px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]',
        surface ? cn('bg-current/10', surface.secondary) : 'bg-muted text-muted-foreground',
      )}
      data-document-file-type="true"
    >
      {type}
    </span>
  )
}

function DocumentTitle({ children, className }: { children: string; className?: string }) {
  return (
    <h3
      className={cn('font-sans text-base font-semibold leading-snug text-current', className)}
      data-document-title="true"
    >
      {children}
    </h3>
  )
}

export function DocumentActions({
  buttonClassNames,
  className,
  display,
  document,
  layout,
  linkClassName,
}: DocumentActionsProps) {
  if (document.actions.length === 0) return null

  return (
    <div
      className={cn('flex flex-wrap items-center gap-3', className)}
      data-document-actions-display={display}
      data-document-actions-layout={layout}
    >
      {document.actions.map((action, index) => {
        const usesCompactActions = layout === 'inline' || display === 'icons'
        const isLink = action.mode === 'link' && (action.kind === 'custom' || !usesCompactActions)
        const isCustomButton = action.kind === 'custom' && action.mode === 'button'
        const isCompactButton = !isLink && !isCustomButton && usesCompactActions
        const buttonVariant = action.mode === 'button' ? action.variant : 'default'

        return (
          <a
            aria-label={isCompactButton ? action.label : undefined}
            className={cn(
              isLink
                ? cn(
                    buttonVariants({ variant: 'link' }),
                    'h-auto px-0 py-0 text-sm font-semibold underline decoration-current decoration-2 underline-offset-4',
                    linkClassName,
                  )
                : isCompactButton
                  ? buttonVariants({ size: 'icon-sm', variant: buttonVariant })
                  : buttonVariants({ size: 'sm', variant: buttonVariant }),
              'group/button',
              isLink ? undefined : buttonClassNames?.[buttonVariant],
            )}
            data-document-action={action.kind}
            download={action.kind === 'download' ? true : undefined}
            href={action.href}
            key={`${action.kind}-${action.href}-${index}`}
            rel={action.openInNewTab ? 'noreferrer' : undefined}
            target={action.openInNewTab ? '_blank' : undefined}
            title={isCompactButton ? action.label : undefined}
          >
            {isLink ? (
              <span data-document-action-label="true">{action.label}</span>
            ) : isCompactButton ? (
              <DocumentActionIcon action={action} />
            ) : isCustomButton ? (
              <>
                <span data-document-action-label="true">{action.label}</span>
                {action.showArrow ? (
                  <ActionArrow data-action-arrow="true" data-icon="inline-end" />
                ) : null}
              </>
            ) : (
              <>
                <span data-document-action-label="true">{action.label}</span>
                <DocumentActionIcon action={action} />
              </>
            )}
          </a>
        )
      })}
    </div>
  )
}

function GridDocumentItem({
  document,
  documentIconSize,
  gridActionDisplay,
  gridIconPosition,
  sectionBackground,
  showDocumentIcon,
  variant,
}: {
  document: ResolvedDownload
  documentIconSize: DownloadDocumentIconSize
  gridActionDisplay: DownloadGridActionDisplay
  gridIconPosition: DownloadGridIconPosition
  sectionBackground: BlockBackground
  showDocumentIcon: boolean
  variant: 'card' | 'grid'
}) {
  const surface = resolveCardSurface(
    variant === 'card' ? document.cardBackground : 'default',
    sectionBackground,
  )

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col p-5 sm:p-6',
        variant === 'card'
          ? cn(
              'rounded-card border transition-colors',
              surface.className,
              surface.divider,
            )
          : 'border-r border-b border-current/15 transition-colors hover:bg-current/[0.035]',
      )}
      data-card-background={variant === 'card' ? surface.value : undefined}
      data-download-document="true"
      data-grid-icon-position={gridIconPosition}
    >
      {gridIconPosition === 'above' ? (
        <>
          <div
            className="flex items-start justify-between gap-4"
            data-download-card-top-row={variant === 'card' ? 'true' : undefined}
            data-download-grid-icon-row="true"
          >
            {showDocumentIcon ? (
              <DocumentIcon
                className={surface.icon}
                size={documentIconSize}
                type={document.fileType}
              />
            ) : null}
            <div className="ml-auto flex justify-end" data-download-grid-badge-slot="true">
              <FileTypeBadge surface={surface} type={document.fileType} />
            </div>
          </div>
          <div className="mt-6 flex min-w-0 flex-col items-start">
            <DocumentTitle>{document.title}</DocumentTitle>
            {document.description ? (
              <p className={cn('mt-2 text-sm leading-6', surface.secondary)}>
                {document.description}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="order-2 ml-auto flex shrink-0 justify-end"
            data-download-grid-badge-slot="true"
          >
            <FileTypeBadge surface={surface} type={document.fileType} />
          </div>
          <div
            className="order-1 flex min-w-0 flex-1 items-start gap-4"
            data-download-grid-inline-content="true"
          >
            {showDocumentIcon ? (
              <DocumentIcon
                className={surface.icon}
                size={documentIconSize}
                type={document.fileType}
              />
            ) : null}
            <div className="flex min-w-0 flex-col items-start">
              <DocumentTitle>{document.title}</DocumentTitle>
              {document.description ? (
                <p className={cn('mt-2 text-sm leading-6', surface.secondary)}>
                  {document.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <DocumentActions
        buttonClassNames={surface.button}
        className="mt-auto pt-6"
        display={gridActionDisplay}
        document={document}
        layout="grid"
        linkClassName={surface.link}
      />
    </article>
  )
}

function GridPresentation(props: PresentationProps) {
  const {
    columns,
    displayMode,
    documentIconSize,
    downloads,
    gridActionDisplay,
    gridIconPosition,
    sectionBackground,
    showDocumentIcon,
  } = props
  const isCard = displayMode === 'cards'
  const isFramed = displayMode === 'framedGrid'
  const items = downloads.map((document) => (
    <GridDocumentItem
      document={document}
      documentIconSize={documentIconSize}
      gridActionDisplay={gridActionDisplay}
      gridIconPosition={gridIconPosition}
      key={document.id}
      sectionBackground={sectionBackground}
      showDocumentIcon={showDocumentIcon}
      variant={isCard ? 'card' : 'grid'}
    />
  ))

  if (isCard) {
    return (
      <div
        className={cn('grid gap-4', gridColumnClasses[columns])}
        data-download-grid="true"
        data-download-presentation="card"
      >
        {items}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden border-current/15',
        isFramed ? 'rounded-none border' : 'border-y',
      )}
      data-download-grid-frame={isFramed ? 'framed' : 'open'}
      data-download-grid-outer-border={isFramed ? 'true' : undefined}
      data-download-presentation={displayMode}
    >
      <div
        className={cn('-mb-px -mr-px grid', gridColumnClasses[columns])}
        data-download-grid="true"
      >
        {items}
      </div>
    </div>
  )
}

function InlinePresentation({
  columns,
  documentIconSize,
  downloads,
  sectionBackground,
  showDocumentIcon,
}: PresentationProps) {
  const surface = resolveCardSurface('default', sectionBackground)

  return (
    <div
      className="overflow-hidden border-y border-current/15"
      data-download-inline-columns={columns}
      data-download-inline-grid="true"
      data-download-presentation="inline"
    >
      <ul
        className={cn('-mb-px -mr-px grid', gridColumnClasses[columns])}
        data-download-grid="true"
      >
        {downloads.map((document) => (
          <li className="min-w-0 border-r border-b border-current/15" key={document.id}>
            <div
              className={cn(
                'grid h-full min-w-0 items-start gap-4 p-5',
                showDocumentIcon
                  ? 'grid-cols-[auto_minmax(0,1fr)_auto_auto]'
                  : 'grid-cols-[minmax(0,1fr)_auto_auto]',
              )}
              data-download-inline-item-container="true"
            >
              {showDocumentIcon ? (
                <DocumentIcon
                  className={surface.icon}
                  size={documentIconSize}
                  type={document.fileType}
                />
              ) : null}
              <div className="flex min-w-0 flex-col items-start">
                <DocumentTitle>{document.title}</DocumentTitle>
                {document.description ? (
                  <p className="mt-1 text-sm leading-6 text-current/70">{document.description}</p>
                ) : null}
              </div>
              <span
                aria-hidden="true"
                className="self-stretch border-l border-current/15"
                data-download-item-action-divider="true"
              />
              <DocumentActions
                buttonClassNames={surface.button}
                className="self-center justify-end"
                display="icons"
                document={document}
                layout="inline"
                linkClassName={surface.link}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DownloadListPresentation(props: PresentationProps) {
  if (
    props.displayMode === 'cards' ||
    props.displayMode === 'openGrid' ||
    props.displayMode === 'framedGrid'
  ) {
    return <GridPresentation {...props} />
  }
  return <InlinePresentation {...props} />
}

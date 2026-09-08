'use client'

// Adapted from @shadcnblocks/integration23 for editorial partner directories.
import Image from 'next/image'
import { useState } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { resolveCmsActions, type CmsActionValue, type ResolvedCmsAction } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type Integration23Item = {
  id: string
  name: string
  image?: { src: string; alt: string; width?: number; height?: number }
  description?: string
  actions: ResolvedCmsAction[]
}

type Integration23Props = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: '1' | '2' | '3' | '4' | '6' | null
  contentAlignment?: 'left' | 'center' | 'right' | null
  description?: string | null
  enableDetails?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  items: Integration23Item[]
  layoutMode?: 'stacked' | 'split' | null
  gridPosition?: 'left' | 'right' | null
  splitProportion?: 'balanced' | 'directoryFocus' | 'sectionFocus' | null
  itemLayout?: 'inline' | 'block' | null
  itemAlignment?: 'left' | 'center' | null
  gridStyle?: 'grid' | 'ruled' | null
  sectionVerticalAlignment?: 'top' | 'center' | 'bottom' | null
  size?: RegularBlockSize | null
  title?: string | null
}

const gridClasses = {
  '1': '',
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
  '6': 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
} as const

// Split panels size their cells against the directory width, not the viewport.
const splitGridClasses = {
  '1': '',
  '2': '@sm:grid-cols-2',
  '3': '@sm:grid-cols-2 @2xl:grid-cols-3',
  '4': '@sm:grid-cols-2 @2xl:grid-cols-3 @3xl:grid-cols-4',
  '6': '@sm:grid-cols-2 @2xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6',
} as const

const verticalAlignmentClasses = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
} as const

const alignmentClasses = {
  left: 'items-start justify-self-start text-left',
  center: 'items-center justify-self-center text-center',
  right: 'items-end justify-self-end text-right',
} as const

function PartnerLogo({
  item,
  inline = false,
  alignLeft = false,
}: {
  item: Integration23Item
  inline?: boolean
  alignLeft?: boolean
}) {
  const [failedSource, setFailedSource] = useState<string>()
  const image = item.image

  return image && failedSource !== image.src ? (
    <Image
      alt=""
      className={cn(
        'shrink-0 object-contain',
        inline ? 'size-12' : 'h-12 w-32 max-w-full',
        alignLeft && 'object-left',
      )}
      height={image.height || 48}
      onError={() => setFailedSource(image.src)}
      src={image.src}
      width={image.width || 128}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-compact bg-current/5 font-mono text-sm font-medium"
    >
      {item.name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => Array.from(word)[0])
        .join('')
        .toUpperCase()}
    </span>
  )
}

export function Integration23({
  accentTitle,
  actions,
  appearance,
  columns,
  contentAlignment,
  description,
  enableDetails,
  eyebrow,
  footerActions,
  items,
  layoutMode,
  gridPosition,
  splitProportion,
  itemLayout,
  itemAlignment,
  gridStyle,
  sectionVerticalAlignment,
  size,
  title,
}: Integration23Props) {
  const alignment = contentAlignment ?? 'left'
  const { className, background } = resolveBlockAppearanceClasses(appearance)
  const surface = resolveCardSurface('default', background)
  const headerActions = resolveCmsActions(actions)
  const endActions = resolveCmsActions(footerActions)
  const hasHeader =
    title?.trim() ||
    accentTitle?.trim() ||
    eyebrow?.trim() ||
    description?.trim() ||
    headerActions.length > 0

  const isSplit = layoutMode === 'split' && Boolean(hasHeader)
  const gridOnLeft = gridPosition === 'left'
  const isInline = itemLayout === 'inline'
  const alignItemsLeft = itemAlignment === 'left'
  const isRuled = gridStyle === 'ruled'
  const splitClasses =
    splitProportion === 'directoryFocus'
      ? gridOnLeft
        ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
        : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
      : splitProportion === 'sectionFocus'
        ? gridOnLeft
          ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
          : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
        : 'lg:grid-cols-2'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], className)}
      data-integration23="true"
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        <div
          data-integration23-layout={isSplit ? 'split' : 'stacked'}
          className={cn(
            'grid min-w-0 grid-cols-1 items-start gap-10',
            isSplit && 'lg:gap-12',
            isSplit && splitClasses,
          )}
        >
          {hasHeader ? (
            <div
              data-integration23-content="true"
              className={cn(
                contentIntroClasses,
                'w-full min-w-0 [overflow-wrap:anywhere]',
                alignmentClasses[alignment],
                isSplit && verticalAlignmentClasses[sectionVerticalAlignment ?? 'top'],
                isSplit && gridOnLeft && 'lg:col-start-2 lg:row-start-1',
              )}
            >
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={background}>{eyebrow.trim()}</SectionEyebrow>
              ) : null}
              {title?.trim() || accentTitle?.trim() ? (
                <h2 className={contentSectionHeadingClasses}>
                  {title?.trim()}
                  {accentTitle?.trim() ? (
                    <>
                      {title?.trim() ? ' ' : ''}
                      <span className="italic">{accentTitle.trim()}</span>
                    </>
                  ) : null}
                </h2>
              ) : null}
              {description?.trim() ? (
                <p
                  className={cn(contentSectionDescriptionClasses, 'w-full max-w-3xl text-current/80')}
                >
                  {description.trim()}
                </p>
              ) : null}
              <ContentActions
                actions={headerActions}
                alignment={alignment}
                buttonClassNames={surface.button}
                linkClassName={surface.link}
              />
            </div>
          ) : null}

          <div
            data-integration23-grid="true"
            data-integration23-grid-style={isRuled ? 'ruled' : 'grid'}
            className={cn(
              '@container min-w-0 overflow-hidden',
              !isRuled && 'rounded-compact border border-current/15',
              isSplit && gridOnLeft && 'lg:col-start-1 lg:row-start-1',
            )}
          >
            <ul
              className={cn(
                '-mb-px -mr-px grid grid-cols-1',
                (isSplit ? splitGridClasses : gridClasses)[columns ?? '4'],
              )}
            >
              {items.map((item) => {
                const content = (
                  <>
                    <PartnerLogo item={item} inline={isInline} alignLeft={alignItemsLeft} />
                    <span
                      className={cn(
                        'min-w-0 text-sm leading-6 font-medium [overflow-wrap:anywhere]',
                        !isInline && 'w-full',
                      )}
                    >
                      {item.name}
                    </span>
                  </>
                )
                const cellClassName = cn(
                  'flex h-full w-full min-w-0 px-6',
                  isInline
                    ? 'flex-row items-center gap-4 py-6'
                    : 'flex-col justify-center gap-3 py-8',
                  alignItemsLeft ? 'text-left' : 'text-center',
                  isInline
                    ? alignItemsLeft
                      ? 'justify-start'
                      : 'justify-center'
                    : alignItemsLeft
                      ? 'items-start'
                      : 'items-center',
                )
                const interactive =
                  enableDetails !== false && Boolean(item.description || item.actions.length)

                return (
                  <li
                    data-integration23-item-layout={isInline ? 'inline' : 'block'}
                    className="min-w-0 border-r border-b border-current/15"
                    key={item.id}
                  >
                    {interactive ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className={cn(
                              cellClassName,
                              'cursor-pointer transition-colors hover:bg-current/5 focus-visible:bg-current/5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current',
                            )}
                            type="button"
                          >
                            {content}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85dvh] overflow-y-auto [overflow-wrap:anywhere]">
                          <DialogHeader className="gap-4 pr-6">
                            <PartnerLogo item={item} />
                            <DialogTitle>{item.name}</DialogTitle>
                            <DialogDescription
                              className={cn('whitespace-pre-line', !item.description && 'sr-only')}
                            >
                              {item.description || `More information about ${item.name}.`}
                            </DialogDescription>
                          </DialogHeader>
                          <ContentActions
                            actions={item.actions}
                            className="[&_a]:max-w-full [&_a]:whitespace-normal"
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className={cellClassName}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <ContentActions
          data-integration23-footer="true"
          actions={endActions}
          alignment={alignment}
          buttonClassNames={surface.button}
          linkClassName={surface.link}
        />
      </div>
    </section>
  )
}

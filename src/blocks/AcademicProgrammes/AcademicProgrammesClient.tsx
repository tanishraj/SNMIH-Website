'use client'

import Image from 'next/image'
import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentItemDescriptionClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
import { getContentTabClasses } from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { ActionArrow } from '@/components/ActionArrow'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { DetailedProgrammeCard } from './DetailedProgrammeCard'
import type { AcademicProgrammesViewMode, ResolvedAcademicProgramme } from './types'

export type { ResolvedAcademicProgramme } from './types'

type AcademicProgrammesClientProps = {
  background: BlockBackground
  columns: '2' | '3' | '4'
  contentAlignment: 'center' | 'left' | 'right'
  metadataPosition: 'bottom' | 'flow'
  programmes: ResolvedAcademicProgramme[]
  showFilter: boolean
  viewMode: AcademicProgrammesViewMode
}

type ProgrammeCategory = {
  key: string
  label: string
}

const gridClasses = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 xl:grid-cols-4',
} as const

const filterAlignmentClasses = {
  left: 'self-start',
  center: 'self-center',
  right: 'self-end',
} as const

const getCategoryKey = (value?: string): string => value?.trim().toLowerCase() ?? ''

const getCategories = (programmes: ResolvedAcademicProgramme[]): ProgrammeCategory[] => {
  const seen = new Set<string>()
  const categories: ProgrammeCategory[] = []

  for (const programme of programmes) {
    const label = programme.eyebrow?.trim()
    const key = getCategoryKey(label)

    if (!label || !key || seen.has(key)) continue

    seen.add(key)
    categories.push({ key, label })
  }

  return categories
}

function ProgrammeMetadata({
  duration,
  durationLabel,
  intake,
  intakeLabel,
  position,
  secondaryClassName,
  dividerClassName,
}: {
  dividerClassName: string
  duration?: string
  durationLabel?: string
  intake?: string
  intakeLabel?: string
  position: AcademicProgrammesClientProps['metadataPosition']
  secondaryClassName: string
}) {
  if (!duration && !intake) return null

  const resolvedDurationLabel = durationLabel?.trim() || 'Duration'
  const resolvedIntakeLabel = intakeLabel?.trim() || 'Intake'
  const isBottom = position === 'bottom'

  return (
    <dl
      className={cn(
        'mt-6 grid grid-cols-2',
        isBottom ? '-mx-7 border-t sm:-mx-8' : 'border-y',
        dividerClassName,
      )}
      data-academic-programme-metadata={position}
    >
      {duration ? (
        <div
          className={cn(
            'min-w-0 py-3 pr-3',
            isBottom && 'pl-7 sm:pl-8',
            intake && 'border-r',
            dividerClassName,
          )}
        >
          <dt className={cn(contentItemMetadataClasses, secondaryClassName)}>
            {resolvedDurationLabel}
          </dt>
          <dd className="mt-1 font-sans text-sm font-medium text-current">{duration}</dd>
        </div>
      ) : null}
      {intake ? (
        <div
          className={cn(
            'min-w-0 py-3',
            isBottom ? (duration ? 'pl-3 pr-7 sm:pr-8' : 'px-7 sm:px-8') : duration && 'pl-3',
          )}
        >
          <dt className={cn(contentItemMetadataClasses, secondaryClassName)}>
            {resolvedIntakeLabel}
          </dt>
          <dd className="mt-1 font-sans text-sm font-medium text-current">{intake}</dd>
        </div>
      ) : null}
    </dl>
  )
}

function ProgrammeCard({
  background,
  columns,
  metadataPosition,
  programme,
  viewMode,
}: {
  background: BlockBackground
  columns: AcademicProgrammesClientProps['columns']
  metadataPosition: AcademicProgrammesClientProps['metadataPosition']
  programme: ResolvedAcademicProgramme
  viewMode: 'grid' | 'list'
}) {
  const surface = resolveCardSurface(programme.cardBackground, background)
  const usesDefaultSurface = surface.value === 'default'
  const hasIntro = Boolean(programme.badge || programme.eyebrow)
  const hasMetadata = Boolean(programme.duration || programme.intake)
  const hasBottomMetadata = metadataPosition === 'bottom' && hasMetadata
  const hasAction = Boolean(programme.href)
  const usesInlineAction = hasBottomMetadata && hasAction
  const hasBottomContent = hasMetadata || (hasAction && !usesInlineAction)
  const isList = viewMode === 'list'
  const dividerClassName = usesDefaultSurface ? 'border-border' : surface.divider
  const metadataElement = (
    <ProgrammeMetadata
      dividerClassName={dividerClassName}
      duration={programme.duration}
      durationLabel={programme.durationLabel}
      intake={programme.intake}
      intakeLabel={programme.intakeLabel}
      position={metadataPosition}
      secondaryClassName={usesDefaultSurface ? 'text-muted-foreground' : surface.secondary}
    />
  )
  const actionContent = (
    <span
      className={cn(
        'text-sm font-semibold',
        usesInlineAction
          ? 'inline-flex items-center gap-2'
          : 'flex w-full items-center justify-between',
        !usesDefaultSurface && surface.link,
      )}
    >
      <span className="underline decoration-current decoration-2 underline-offset-4">
        {programme.ctaLabel}
      </span>
      <ActionArrow />
    </span>
  )
  const actionElement = programme.href ? (
    usesInlineAction ? (
      <div className="mt-5" data-academic-programme-action="inline">
        {actionContent}
      </div>
    ) : (
      <div
        className={cn(
          programme.description || hasMetadata ? 'pt-8' : 'pt-6',
          metadataPosition === 'flow' && 'mt-auto',
        )}
        data-academic-programme-action-spacing="ruled"
      >
        <div
          className={cn('border-t pt-5', dividerClassName)}
          data-academic-programme-action="ruled"
        >
          {actionContent}
        </div>
      </div>
    )
  ) : null
  const lowerContent =
    metadataPosition === 'bottom' ? (
      <>
        {usesInlineAction ? actionElement : null}
        {hasBottomContent ? (
          <div className="mt-auto flow-root" data-academic-programme-bottom-content="true">
            {usesInlineAction ? null : actionElement}
            {metadataElement}
          </div>
        ) : null}
      </>
    ) : (
      <>
        {metadataElement}
        {actionElement}
      </>
    )
  const content = (
    <article
      className={cn(
        'group/programme h-full min-w-0 overflow-hidden border',
        'rounded-card',
        isList && programme.image
          ? 'grid md:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]'
          : 'flex flex-col',
        usesDefaultSurface
          ? 'border-border bg-card text-card-foreground'
          : [surface.className, surface.divider],
        programme.href &&
          'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 [@media(hover:hover)]:group-hover/button:border-primary/35 [@media(hover:hover)]:group-hover/button:shadow-sm',
      )}
      data-academic-programme="true"
      data-academic-programme-image={programme.image ? 'true' : 'false'}
      data-academic-programme-layout={viewMode}
      data-academic-programme-metadata-position={metadataPosition}
      data-card-background={surface.value}
    >
      {programme.image ? (
        <div
          className={cn(
            'relative overflow-hidden bg-muted',
            isList ? 'h-56 sm:h-64 md:h-auto md:min-h-full' : 'h-64 sm:h-72',
          )}
        >
          <Image
            alt={programme.image.alt}
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out [@media(hover:hover)]:group-hover/programme:scale-[1.025] group-focus-within/programme:scale-[1.025]"
            fill
            sizes={
              isList
                ? '(max-width: 768px) 100vw, 34vw'
                : columns === '4'
                  ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw'
                  : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
            src={programme.image.src}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col px-7 pt-7 sm:px-8 sm:pt-8',
          hasBottomMetadata ? 'pb-0' : 'pb-7 sm:pb-8',
        )}
        data-academic-programme-content={hasBottomMetadata ? 'bottom-metadata' : 'standard'}
      >
        {programme.badge ? (
          <Badge className="border-current/20 bg-current/5 text-current" variant="outline">
            {programme.badge}
          </Badge>
        ) : null}
        {programme.eyebrow ? (
          <div className={programme.badge ? 'mt-4' : undefined}>
            <SectionEyebrow surface={surface.value === 'primary' ? 'brand' : 'none'}>
              {programme.eyebrow}
            </SectionEyebrow>
          </div>
        ) : null}
        <h3 className={cn(contentItemTitleClasses, hasIntro && 'mt-4')}>{programme.title}</h3>
        {programme.description ? (
          <p
            className={cn(
              contentItemDescriptionClasses,
              'mt-3',
              !usesDefaultSurface && surface.secondary,
            )}
          >
            {programme.description}
          </p>
        ) : null}

        {lowerContent}
      </div>
    </article>
  )

  return programme.href ? (
    <a
      className={cn(
        'group/button block h-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
        'rounded-card',
      )}
      data-academic-programme-link="true"
      href={programme.href}
      rel={programme.openInNewTab ? 'noopener noreferrer' : undefined}
      target={programme.openInNewTab ? '_blank' : undefined}
    >
      {content}
    </a>
  ) : (
    <div className="h-full">{content}</div>
  )
}

export function AcademicProgrammesClient({
  background,
  columns,
  contentAlignment,
  metadataPosition,
  programmes,
  showFilter,
  viewMode,
}: AcademicProgrammesClientProps) {
  const componentID = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const categories = getCategories(programmes)
  const hasFilters = showFilter && categories.length >= 2
  const tabs = hasFilters ? [{ key: 'all', label: 'All' }, ...categories] : []
  const [selectedCategory, setSelectedCategory] = useState('all')
  const activeCategory = tabs.some(({ key }) => key === selectedCategory) ? selectedCategory : 'all'
  const visibleProgrammes =
    hasFilters && activeCategory !== 'all'
      ? programmes.filter(({ eyebrow }) => getCategoryKey(eyebrow) === activeCategory)
      : programmes
  const panelID = `${componentID}-panel`
  const tabSurface = resolveBlockSurface(background)

  const activateTab = (index: number) => {
    const nextTab = tabs[index]
    if (!nextTab) return

    setSelectedCategory(nextTab.key)
    tabRefs.current[index]?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === undefined) return

    event.preventDefault()
    activateTab(nextIndex)
  }

  return (
    <div className="flex min-w-0 flex-col gap-8 md:gap-10" data-academic-programmes-view={viewMode}>
      {hasFilters ? (
        <div
          className={cn('max-w-full pb-1', filterAlignmentClasses[contentAlignment])}
        >
          <ScrollableContentTabRail
            className="w-fit max-w-full"
            data-academic-programmes-filter="true"
            surface={tabSurface}
            variant="pill"
          >
            <div
              aria-label="Programme categories"
              className="flex w-max flex-nowrap"
              role="tablist"
            >
              {tabs.map((tab, index) => {
                const active = tab.key === activeCategory
                const tabID = `${componentID}-tab-${index}`

                return (
                  <button
                    aria-controls={panelID}
                    aria-selected={active}
                    className={getContentTabClasses('pill', active, tabSurface)}
                    id={tabID}
                    key={tab.key}
                    onClick={() => setSelectedCategory(tab.key)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    role="tab"
                    tabIndex={active ? 0 : -1}
                    type="button"
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </ScrollableContentTabRail>
        </div>
      ) : null}

      <div
        aria-labelledby={
          hasFilters
            ? `${componentID}-tab-${tabs.findIndex(({ key }) => key === activeCategory)}`
            : undefined
        }
        className={cn(
          viewMode === 'list'
            ? 'flex flex-col gap-5'
            : cn('grid grid-cols-1 gap-6', gridClasses[columns]),
        )}
        data-academic-programmes-panel="true"
        id={hasFilters ? panelID : undefined}
        role={hasFilters ? 'tabpanel' : undefined}
        tabIndex={hasFilters ? 0 : undefined}
      >
        {visibleProgrammes.map((programme) =>
          viewMode === 'detailedCards' ? (
            <DetailedProgrammeCard
              background={background}
              key={String(programme.id)}
              programme={programme}
            />
          ) : (
            <ProgrammeCard
              background={background}
              columns={columns}
              key={String(programme.id)}
              metadataPosition={metadataPosition}
              programme={programme}
              viewMode={viewMode}
            />
          ),
        )}
      </div>
    </div>
  )
}

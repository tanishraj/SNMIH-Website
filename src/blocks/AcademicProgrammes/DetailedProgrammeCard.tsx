'use client'

import { DynamicIcon, dynamicIconImports, type IconName } from 'lucide-react/dynamic'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentItemDescriptionClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
import { ActionArrow } from '@/components/ActionArrow'
import { cn } from '@/lib/utils'

import type { ResolvedAcademicProgramme } from './types'

const normalizeDynamicIconName = (value?: string) =>
  value
    ?.trim()
    .replace(/Icon$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const getDynamicIconName = (value?: string): IconName | undefined => {
  const normalized = normalizeDynamicIconName(value)
  return normalized && normalized in dynamicIconImports ? (normalized as IconName) : undefined
}

export function DetailedProgrammeCard({
  background,
  programme,
}: {
  background: BlockBackground
  programme: ResolvedAcademicProgramme
}) {
  const surface = resolveCardSurface(programme.cardBackground, background)
  const usesDefaultSurface = surface.value === 'default'
  const programmeIcon = getDynamicIconName(programme.icon)
  const hasUtilityRow = Boolean(programmeIcon || programme.duration)
  const content = (
    <article
      className={cn(
        'group/programme flex h-full min-w-0 flex-col overflow-hidden rounded-card border',
        usesDefaultSurface
          ? 'border-border bg-card text-card-foreground'
          : [surface.className, surface.divider],
        programme.href &&
          'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 [@media(hover:hover)]:group-hover/button:border-primary/35 [@media(hover:hover)]:group-hover/button:shadow-sm',
      )}
      data-academic-programme="true"
      data-academic-programme-layout="detailedCards"
      data-card-background={surface.value}
    >
      <div className="flex h-full min-w-0 flex-col p-7 sm:p-8">
        {hasUtilityRow ? (
          <div className="flex min-h-11 items-start justify-between gap-4">
            {programmeIcon ? (
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-compact border border-current/10 bg-current/5',
                  surface.icon,
                )}
                data-academic-programme-icon={programmeIcon}
              >
                <DynamicIcon
                  aria-hidden="true"
                  name={programmeIcon}
                  size={20}
                  strokeWidth={1.75}
                />
              </span>
            ) : null}
            {programme.duration ? (
              <span
                className={cn(
                  'ml-auto rounded-full border border-current/15 bg-current/5 px-3 py-1 font-sans text-xs font-medium',
                  !usesDefaultSurface && surface.secondary,
                )}
                data-academic-programme-duration="true"
              >
                {programme.duration}
              </span>
            ) : null}
          </div>
        ) : null}

        <h3 className={cn(contentItemTitleClasses, hasUtilityRow && 'mt-6')}>
          {programme.title}
        </h3>
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

        {programme.facts.length ? (
          <dl
            className="mt-6 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-x-5 gap-y-5"
            data-academic-programme-facts="true"
          >
            {programme.facts.map((fact, index) => {
              const factIcon = getDynamicIconName(fact.icon)

              return (
                <div className="min-w-0" key={`${fact.label}-${index}`}>
                  <dt
                    className={cn(
                      contentItemMetadataClasses,
                      'flex items-center gap-1.5',
                      usesDefaultSurface ? 'text-muted-foreground' : surface.secondary,
                    )}
                  >
                    {factIcon ? (
                      <DynamicIcon
                        aria-hidden="true"
                        className="size-3 shrink-0"
                        name={factIcon}
                        strokeWidth={1.75}
                      />
                    ) : null}
                    <span>{fact.label}</span>
                  </dt>
                  <dd className="mt-1.5 font-sans text-sm font-medium leading-5 text-current">
                    {fact.value}
                  </dd>
                </div>
              )
            })}
          </dl>
        ) : null}

        {programme.href ? (
          <div className="mt-auto pt-7" data-academic-programme-action="detailed">
            <span
              className={cn(
                'inline-flex items-center gap-2 text-sm font-semibold',
                !usesDefaultSurface && surface.link,
              )}
            >
              <span className="underline decoration-current decoration-2 underline-offset-4">
                {programme.ctaLabel}
              </span>
              <ActionArrow />
            </span>
          </div>
        ) : null}
      </div>
    </article>
  )

  return programme.href ? (
    <a
      className="group/button block h-full rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
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

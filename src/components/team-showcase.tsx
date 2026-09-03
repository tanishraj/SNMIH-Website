'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import React, { memo, useState, type ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import { cn } from '@/lib/utils'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'

type TeamShowcaseAlignment = 'left' | 'center' | 'right'
type TeamShowcaseSize = 'none' | 'compact' | 'default' | 'comfortable'

interface TeamShowcaseMember {
  cardBackground?: string | null
  image: string
  name: string
  role: string
  description: string
}

interface TeamShowcaseMemberCardProps {
  member: TeamShowcaseMember
  highlighted?: boolean
  sectionBackground: BlockBackground
}

const TeamShowcaseMemberCard = memo(
  ({ member, highlighted = false, sectionBackground }: TeamShowcaseMemberCardProps) => {
    const surface = resolveCardSurface(member.cardBackground, sectionBackground)
    return (
      <div
        className={cn(
          'flex h-full flex-col gap-4 px-2 md:px-5 md:pt-8',
          surface.className,
          highlighted && 'md:py-0 md:pb-4',
        )}
        data-card-background={surface.value}
      >
        <div
          className={cn(
            'flex flex-col gap-2 pt-4 md:flex-row md:items-center',
            !highlighted && 'border-b pb-4 md:border-b-2',
            surface.divider,
          )}
        >
          <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-compact border md:size-12 md:aspect-auto">
            <Image
              fill
              src={member.image}
              alt={`${member.name} Profile Picture`}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 48px"
            />
          </div>

          <div className="flex flex-col gap-1 tracking-tight">
            <p className="line-clamp-1">{member.name}</p>
            <p className={cn('line-clamp-1 text-sm', surface.secondary)}>{member.role}</p>
          </div>
        </div>
        {highlighted && (
          <>
            <span className={cn('h-0.5 w-full bg-current opacity-30', surface.icon)} />
            <p className="line-clamp-2 text-xs">{member.description}</p>
          </>
        )}
      </div>
    )
  },
)
TeamShowcaseMemberCard.displayName = 'TeamShowcaseMemberCard'

interface TeamShowcaseProps {
  accentHeading?: string
  appearance?: BlockAppearance | null
  className?: string
  contentAlignment?: TeamShowcaseAlignment
  actions?: ReactNode
  description?: string
  heading?: string
  members?: TeamShowcaseMember[]
  showHeaderDivider?: boolean
  size?: TeamShowcaseSize
}

const contentAlignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

const sectionGapWithoutDividerClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

export const getTeamGridClasses = (memberCount: number) => {
  if (memberCount === 2) return 'grid grid-cols-2 md:grid-cols-2'
  if (memberCount === 3) return 'grid grid-cols-2 md:grid-cols-3'

  return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
}

const TeamShowcase = ({
  accentHeading,
  appearance,
  className,
  actions,
  contentAlignment = 'left',
  showHeaderDivider = true,
  description,
  heading,
  members = [],
  size = 'default',
}: TeamShowcaseProps) => {
  const resolvedAccentHeading = accentHeading?.trim() || undefined
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedSize = size ?? 'default'
  const resolvedDescription = description?.trim()
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'

  if (!members.length) {
    return null
  }

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[resolvedSize],
        appearanceClasses.className,
        className,
      )}
    >
      <div className={cn(regularBlockContainerClasses, contentAlignmentClasses[resolvedAlignment])}>
        <div
          className={cn(
            'flex flex-col',
            showHeaderDivider
              ? sectionGapClasses[resolvedSize]
              : sectionGapWithoutDividerClasses[resolvedSize],
          )}
        >
          <div
            className={cn('flex flex-col gap-4', showHeaderDivider ? 'border-b-2 pb-6' : 'pb-3')}
          >
            {heading?.trim() ? (
              <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                {resolvedAccentHeading ? (
                  <>
                    <span className="block font-[inherit]">{heading.trim()}</span>
                    <em className="block font-[inherit]">{resolvedAccentHeading}</em>
                  </>
                ) : (
                  heading.trim()
                )}
              </h2>
            ) : null}
            {resolvedDescription ? (
              <p className="text-base leading-7 text-balance text-current/70">
                {resolvedDescription}
              </p>
            ) : null}
            {actions}
          </div>
          <ul
            onMouseLeave={() => setHoveredMember(null)}
            className={getTeamGridClasses(members.length)}
          >
            {members.map((member, index) => {
              const hoverSurface = resolveCardSurface(member.cardBackground, sectionBackground)
              const hoverSurfaceClassName =
                hoverSurface.value === 'default'
                  ? 'bg-card text-card-foreground'
                  : hoverSurface.className

              return (
                <li
                  key={`team-showcase-member-${index}`}
                  onMouseEnter={() => setHoveredMember(index)}
                  className="relative"
                >
                  <TeamShowcaseMemberCard member={member} sectionBackground={sectionBackground} />

                  {hoveredMember === index && (
                    <motion.div
                      layoutId="team-showcase-member-card"
                      transition={{
                        layout: {
                          duration: 0.2,
                          type: 'spring',
                          bounce: 0.1,
                        },
                      }}
                      className={cn(
                        'pointer-events-none absolute inset-0 z-10 hidden h-max overflow-hidden rounded-card shadow-lg md:block',
                        hoverSurfaceClassName,
                      )}
                      data-team-showcase-hover-surface={hoverSurface.value}
                    >
                      <TeamShowcaseMemberCard
                        member={member}
                        highlighted
                        sectionBackground={sectionBackground}
                      />
                    </motion.div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

export { TeamShowcase }
export type { TeamShowcaseAlignment, TeamShowcaseSize, TeamShowcaseMember }

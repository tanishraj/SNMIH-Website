'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { cn } from '@/lib/utils'

type Services21Alignment = 'left' | 'center' | 'right'

type Services21Item = {
  id: string
  title?: string | null
  description: string
  image: string
}

type Services21Props = {
  accentTitle?: string | null
  appearance?: BlockAppearance | null
  actions?: ReactNode
  contentAlignment?: Services21Alignment
  className?: string
  description?: string | null
  eyebrow?: string | null
  items: Services21Item[]
  size?: 'none' | 'compact' | 'default' | 'comfortable'
  title?: string | null
}

const usePrevious = <T,>(value: T): T | undefined => {
  const [prev, setPrev] = useState<T | undefined>(undefined)
  const ref = useRef(value)

  useEffect(() => {
    setPrev(ref.current)
    ref.current = value
  }, [value])

  return prev
}

export function Services21({
  accentTitle,
  appearance,
  className,
  actions,
  contentAlignment = 'left',
  description,
  eyebrow,
  items,
  size = 'default',
  title,
}: Services21Props) {
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const [activeServiceIndex, setActiveServiceIndex] = useState<number>(0)
  const activeServiceDetailsID = useId()
  const previousServiceIndex = usePrevious(activeServiceIndex)
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  if (!items.length) {
    return null
  }

  const activeService = items[activeServiceIndex] ?? items[0]
  const previousService =
    previousServiceIndex !== undefined ? (items[previousServiceIndex] ?? activeService) : undefined

  const alignmentClasses = {
    center: 'items-center text-center',
    left: 'items-start text-left',
    right: 'items-end text-right',
  } as const

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-services21-background={appearance?.background ?? 'none'}
      data-services21-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <div className="mb-10 flex w-full flex-col gap-4" data-services21-intro="true">
          {eyebrow ? (
            <SectionEyebrow surface={appearance?.background ?? 'none'}>{eyebrow}</SectionEyebrow>
          ) : null}
          {title ? (
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {resolvedAccentTitle ? (
                <>
                  <span className="block font-[inherit]">{title}</span>
                  <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                </>
              ) : (
                title
              )}
            </h2>
          ) : null}
          {description ? (
            <p className="text-base leading-7 text-current/70">{description}</p>
          ) : null}
          {actions}
        </div>
        <div className={cn('flex w-full flex-col justify-between gap-10 lg:flex-row lg:gap-20')}>
          <div
            aria-live="polite"
            className="top-10 h-fit w-full space-y-7 py-8 lg:sticky lg:max-w-xs"
            id={activeServiceDetailsID}
          >
            <div className="relative h-90 overflow-hidden rounded-card">
              {previousService ? (
                <div className="absolute inset-0">
                  <Image
                    fill
                    alt={previousService.title ?? ''}
                    className="object-cover"
                    src={previousService.image}
                    sizes="(max-width: 1024px) 100vw, 20rem"
                  />
                </div>
              ) : null}
              <motion.div
                animate={{ clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] }}
                initial={false}
                key={activeServiceIndex}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                className="relative h-full w-full"
              >
                <Image
                  fill
                  alt={activeService.title ?? ''}
                  className="object-cover"
                  src={activeService.image}
                  sizes="(max-width: 1024px) 100vw, 20rem"
                />
              </motion.div>
            </div>
            {activeService ? (
              <>
                <p className="font-semibold tracking-tight text-current uppercase">
                  {activeService.title}
                </p>
                <p className="text-base leading-7 text-current">{activeService.description}</p>
              </>
            ) : null}
          </div>
          <div className={cn('relative w-full', alignmentClasses[contentAlignment])}>
            <ul className="w-full" data-services21-services-list="true">
              {items.map((service, index) => (
                <li
                  key={`${service.id}-${index}`}
                  className="border-b border-current/20"
                >
                  <button
                    aria-controls={activeServiceDetailsID}
                    aria-pressed={index === activeServiceIndex}
                    className={cn(
                      'w-full cursor-pointer py-8 text-3xl font-semibold tracking-tight transition-colors outline-none motion-reduce:transition-none md:text-5xl lg:text-7xl',
                      'focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset',
                      index === activeServiceIndex
                        ? 'text-current'
                        : 'text-current/75 hover:text-current focus-visible:text-current',
                    )}
                    onClick={() => setActiveServiceIndex(index)}
                    onFocus={() => setActiveServiceIndex(index)}
                    onMouseEnter={() => setActiveServiceIndex(index)}
                    type="button"
                  >
                    <span>{service.title}</span>
                    <sup
                      className={cn(
                        'align-super text-sm lg:text-3xl',
                        appearanceClasses.surface === 'brand'
                          ? 'text-primary-foreground'
                          : 'text-primary',
                      )}
                    >
                      {service.id}
                    </sup>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export type { Services21Alignment, Services21Item, Services21Props }

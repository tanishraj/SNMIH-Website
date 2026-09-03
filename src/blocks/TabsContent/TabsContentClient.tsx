'use client'

import Image from 'next/image'
import { Clock3 } from 'lucide-react'
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic'
import { useId, useState, type KeyboardEvent } from 'react'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import {
  contentItemDescriptionClasses,
  contentSectionDescriptionClasses,
} from '@/blocks/shared/contentStyles'
import {
  getContentTabClasses,
  type ContentTabSurface,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { type ResolvedCmsAction } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type ResolvedTab = {
  accentTitle?: string
  actions: ResolvedCmsAction[]
  description?: string
  eyebrow?: string
  id: string | number
  imageSrc?: string
  imageAlt?: string
  items: Array<{ icon?: string; id: string | number; title: string }>
  label: string
  title?: string
}

const availableIconNames = new Set<string>(iconNames)

const normalizeIconName = (name?: string) =>
  name
    ?.trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

const curriculumColumnClasses = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 md:grid-cols-2 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-px md:before:bg-current/15 md:before:content-[""]',
  '3': 'grid-cols-1 md:grid-cols-2 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-px md:before:bg-current/15 md:before:content-[""] lg:grid-cols-3 lg:before:left-1/3 lg:after:absolute lg:after:inset-y-0 lg:after:left-2/3 lg:after:w-px lg:after:bg-current/15 lg:after:content-[""]',
} as const

type Props = {
  compactGap?: boolean
  sectionBackground: BlockBackground
  tabs: ResolvedTab[]
  tabAlignment?: 'left' | 'center' | 'right' | 'stretch' | null
  tabStyle?: 'underline' | 'pills' | 'boxed' | 'segmented' | null
  contentLayout?: 'imageRight' | 'imageLeft' | 'imageTop' | 'textOnly' | 'curriculum' | null
  curriculumColumns?: '1' | '2' | '3' | null
  tabContentAlignment?: 'left' | 'center'
}

export function TabsContentClient({
  compactGap = false,
  sectionBackground,
  tabs,
  tabAlignment = 'center',
  tabStyle = 'underline',
  contentLayout = 'imageRight',
  curriculumColumns = '2',
  tabContentAlignment = 'left',
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const tabsId = useId()
  const active = tabs[activeIndex]
  const resolvedTabAlignment = tabAlignment ?? 'center'
  const resolvedTabStyle = tabStyle ?? 'underline'
  const resolvedLayout = contentLayout ?? 'imageRight'
  const isBrandSurface = resolveBlockSurface(sectionBackground) === 'brand'
  const tabSurface: ContentTabSurface = isBrandSurface ? 'brand' : 'light'
  const tabVariant: ContentTabVariant =
    resolvedTabStyle === 'underline'
      ? 'underline'
      : resolvedTabStyle === 'boxed'
        ? 'contained'
        : 'pill'

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === undefined) return

    event.preventDefault()
    setActiveIndex(nextIndex)
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons?.[nextIndex]?.focus()
  }

  return (
    <div
      className={cn('flex min-w-0 flex-col', compactGap ? 'gap-3 md:gap-4' : 'gap-4 md:gap-5')}
      data-tabs-content-body="true"
      data-tabs-content-gap={compactGap ? 'compact' : 'default'}
    >
      <ScrollableContentTabRail
        className={cn(
          'max-w-full',
          resolvedTabAlignment === 'stretch' ? 'w-full' : 'w-fit',
          resolvedTabAlignment === 'left' && 'self-start',
          resolvedTabAlignment === 'center' && 'self-center',
          resolvedTabAlignment === 'right' && 'self-end',
        )}
        surface={tabSurface}
        variant={tabVariant}
      >
        <div
          aria-label="Content sections"
          className={cn(
            'flex',
            resolvedTabAlignment === 'stretch' ? 'w-full' : 'w-max',
          )}
          data-tab-alignment={resolvedTabAlignment}
          role="tablist"
        >
          {tabs.map((tab, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={tab.id}
                role="tab"
                id={`${tabsId}-tab-${index}`}
                aria-controls={`${tabsId}-panel`}
                aria-selected={isActive}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  'min-w-28 cursor-pointer',
                  getContentTabClasses(tabVariant, isActive, tabSurface),
                  resolvedTabStyle === 'segmented' && 'min-w-32',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </ScrollableContentTabRail>

      {active ? (
        <div
          role="tabpanel"
          id={`${tabsId}-panel`}
          aria-labelledby={`${tabsId}-tab-${activeIndex}`}
          key={activeIndex}
          className={cn(
            resolvedLayout === 'curriculum'
              ? [
                  'rounded-card border p-5 sm:p-6',
                  isBrandSurface
                    ? 'border-primary-foreground/20 bg-transparent text-primary-foreground'
                    : 'border-border bg-card text-card-foreground',
                ]
              : 'grid gap-8 md:gap-10 lg:gap-14',
            resolvedLayout === 'imageRight' &&
              'md:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] md:items-center',
            resolvedLayout === 'imageLeft' &&
              'md:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)] md:items-center',
            resolvedLayout === 'textOnly' && 'max-w-3xl',
          )}
        >
          {active.imageSrc && resolvedLayout !== 'textOnly' && resolvedLayout !== 'curriculum' ? (
            <div
              className={cn(
                'relative overflow-hidden rounded-card bg-muted',
                resolvedLayout === 'imageTop' ? 'aspect-video w-full' : 'aspect-[4/3] w-full',
                resolvedLayout === 'imageRight' && 'md:col-start-2 md:row-start-1',
              )}
            >
              <Image
                src={active.imageSrc}
                alt={active.imageAlt ?? ''}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 42vw"
              />
            </div>
          ) : null}

          <div
            className={cn(
              'flex min-w-0 flex-col',
              resolvedLayout === 'curriculum' ? 'gap-3' : 'gap-4',
              resolvedLayout === 'imageRight' && 'md:col-start-1 md:row-start-1',
              tabContentAlignment === 'center' && 'items-center text-center',
            )}
          >
            {active.eyebrow ? (
              <SectionEyebrow surface={sectionBackground}>{active.eyebrow}</SectionEyebrow>
            ) : null}
            {active.title ? (
              <h3
                className={cn(
                  'leading-tight font-semibold text-balance text-current',
                  resolvedLayout === 'curriculum'
                    ? 'font-sans text-lg tracking-tight capitalize sm:text-xl'
                    : 'font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl',
                )}
              >
                {active.title}
                {active.accentTitle ? (
                  resolvedLayout === 'curriculum' ? (
                    <span className="ml-2 font-[inherit]">{active.accentTitle}</span>
                  ) : (
                    <em className="ml-2 font-[inherit]">{active.accentTitle}</em>
                  )
                ) : null}
              </h3>
            ) : null}
            {active.description ? (
              <p className={cn(contentSectionDescriptionClasses, 'max-w-[68ch]')}>
                {active.description}
              </p>
            ) : null}
            {active.actions.length > 0 ? (
              <div className="mt-2">
                <ContentActions actions={active.actions} alignment={tabContentAlignment} />
              </div>
            ) : null}
          </div>

          {resolvedLayout === 'curriculum' && active.items.length > 0 ? (
            <ul
              className={cn(
                'relative mt-4 grid gap-x-8 gap-y-3 sm:mt-12',
                curriculumColumnClasses[curriculumColumns ?? '2'],
              )}
              data-curriculum-columns={curriculumColumns ?? '2'}
            >
              {active.items.map((item) => {
                const iconName = normalizeIconName(item.icon)
                const hasCustomIcon = iconName ? availableIconNames.has(iconName) : false

                return (
                  <li key={item.id} className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center',
                        isBrandSurface ? 'text-primary-foreground' : 'text-primary',
                      )}
                      aria-hidden="true"
                    >
                      {hasCustomIcon ? (
                        <DynamicIcon
                          name={iconName as IconName}
                          className="size-5"
                          strokeWidth={1.8}
                          fallback={() => <Clock3 className="size-5" strokeWidth={1.8} />}
                        />
                      ) : (
                        <Clock3 className="size-5" strokeWidth={1.8} />
                      )}
                    </span>
                    <span className={contentItemDescriptionClasses}>{item.title}</span>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

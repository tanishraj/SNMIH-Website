import { ArrowUpRight, MapPin, Users } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  contentItemMetadataClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue, type ResolvedCmsAction } from '@/lib/cmsLinks'
import { formatZonedDate } from '@/lib/siteTimeZone'
import { cn } from '@/lib/utils'

import { careersEmploymentOptions } from './config'

export type CareersLayout = 'notice' | 'register' | 'ledger' | 'departments'
type EmploymentType = (typeof careersEmploymentOptions)[number]['value']

export type CareersGroup = { id?: string | null; name?: string | null }

export type CareersOpening = {
  actions?: CmsActionValue[] | null
  applyBy?: string | null
  department?: string | null
  employmentNote?: string | null
  employmentType?: EmploymentType | null
  /** Id of a row in the block's `groups` array (older content may hold the group name itself). */
  group?: string | null
  id?: string | null
  location?: string | null
  positions?: number | null
  publishedOn?: string | null
  reference?: string | null
  status?: 'open' | 'closed' | null
  summary?: string | null
  title?: string | null
}

export type CareersBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  emptyMessage?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  groups?: CareersGroup[] | null
  layout?: CareersLayout | null
  note?: string | null
  openings?: CareersOpening[] | null
  showCount?: boolean | null
  showGroupNumbers?: boolean | null
  size?: RegularBlockSize | null
  title?: string | null
}

type Opening = {
  action?: ResolvedCmsAction
  applyBy?: string
  department?: string
  employment?: string
  group: string
  id: string
  location?: string
  positions?: string
  posted?: string
  reference?: string
  summary?: string
  title: string
}

const UNGROUPED = 'Other openings'
const text = (value?: string | null) => value?.trim() || undefined
const employmentLabel = (type?: EmploymentType | null, note?: string | null) => {
  const base = careersEmploymentOptions.find((option) => option.value === type)?.label
  return [base, text(note)].filter(Boolean).join(' · ') || undefined
}
const postsLabel = (count?: number | null) =>
  typeof count === 'number' && count > 0 ? `${count} ${count === 1 ? 'post' : 'posts'}` : undefined

const dateLabel = (value?: string | null) =>
  value ? formatZonedDate(value) || undefined : undefined

const configuredGroups = (groups?: CareersGroup[] | null) =>
  (groups ?? []).flatMap((group) => {
    const name = text(group.name)
    return name ? [{ id: group.id ?? undefined, name }] : []
  })

/** An opening points at a group row by id; older content may still hold the group name. */
const groupNameFor = (value: string | undefined, groups: { id?: string; name: string }[]) => {
  if (!value) return UNGROUPED
  const match = groups.find(
    (group) => group.id === value || group.name.toLowerCase() === value.toLowerCase(),
  )
  return match?.name ?? UNGROUPED
}

/** Open posts in saved order, with display strings resolved once. Exported for tests. */
export const resolveCareersOpenings = (
  openings?: CareersOpening[] | null,
  groups?: CareersGroup[] | null,
): Opening[] => {
  const known = configuredGroups(groups)
  return (openings ?? []).flatMap((opening, index) => {
    const title = text(opening.title)
    if (!title || opening.status === 'closed') return []
    return [
      {
        action: resolveCmsActions(opening.actions)[0],
        applyBy: dateLabel(opening.applyBy),
        department: text(opening.department),
        employment: employmentLabel(opening.employmentType, opening.employmentNote),
        group: groupNameFor(text(opening.group), known),
        id: opening.id ?? `opening-${index}`,
        location: text(opening.location),
        positions: postsLabel(opening.positions),
        posted: dateLabel(opening.publishedOn),
        reference: text(opening.reference),
        summary: text(opening.summary),
        title,
      },
    ]
  })
}

/** Groups follow the configured order; "Other openings" (and anything unknown) comes last. */
const groupOpenings = (openings: Opening[], groups?: CareersGroup[] | null) => {
  const byName = new Map<string, Opening[]>()
  for (const opening of openings) {
    byName.set(opening.group, [...(byName.get(opening.group) ?? []), opening])
  }
  const order = [...configuredGroups(groups).map((group) => group.name), ...byName.keys()]
  return [...new Set(order)]
    .filter((name) => name !== UNGROUPED && byName.has(name))
    .concat(byName.has(UNGROUPED) ? [UNGROUPED] : [])
    .map((name) => ({ items: byName.get(name) ?? [], name }))
}

const postedLabel = (posted?: string) => (posted ? `Posted ${posted}` : undefined)

const joinMeta = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ')

// Rows are links when the post has one; otherwise the same markup renders as a plain row.
function RowShell({
  action,
  children,
  className,
  title,
}: {
  action?: ResolvedCmsAction
  children: ReactNode
  className: string
  title: string
}) {
  if (!action) {
    return <li className={cn(className, 'list-none')}>{children}</li>
  }
  return (
    <li className="list-none">
      <a
        aria-label={`${title}: ${action.label}`}
        className={cn(
          className,
          'group rounded-compact outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
        )}
        download={action.download}
        href={action.href}
        rel={action.openInNewTab ? 'noopener noreferrer' : undefined}
        target={action.openInNewTab ? '_blank' : undefined}
      >
        {children}
      </a>
    </li>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <ArrowUpRight
      aria-hidden="true"
      className={cn(
        'size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none',
        className,
      )}
    />
  )
}

function ApplyBy({ date, inline = false }: { date?: string; inline?: boolean }) {
  if (!date) return null
  return (
    <span
      className={cn(
        'whitespace-nowrap',
        inline
          ? 'inline-flex items-baseline gap-2'
          : 'flex flex-col items-start gap-0.5 text-left sm:items-end sm:text-right',
      )}
    >
      <span className={cn(contentItemMetadataClasses, 'text-[11px] uppercase opacity-60')}>
        Apply by
      </span>
      <span className="text-sm font-semibold tabular-nums text-current">{date}</span>
    </span>
  )
}

function GroupHeading({
  count,
  index,
  name,
  numbered,
  surface,
}: {
  count: number
  index: number
  name: string
  numbered: boolean
  surface: BlockBackground
}) {
  return (
    <h3 className="flex items-baseline justify-between gap-4 border-b border-current/20 pb-4 font-sans text-lg font-semibold leading-tight text-current sm:text-xl">
      <span className="flex items-baseline gap-3">
        {numbered ? (
          <span
            className="font-mono text-xs font-medium tracking-[0.14em] text-current"
            data-section-eyebrow-surface={surface}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        ) : null}
        {name}
      </span>
      <span className={cn(contentItemMetadataClasses, 'uppercase opacity-60')}>
        {count} {count === 1 ? 'opening' : 'openings'}
      </span>
    </h3>
  )
}

/** Notice board: centred introduction, then one list with department badges (after shadcnblocks careers9). */
function NoticeList({ openings }: { openings: Opening[] }) {
  return (
    <ul className="divide-y divide-current/10 border-y border-current/20">
      {openings.map((opening) => (
        <RowShell
          action={opening.action}
          className="grid gap-x-10 gap-y-3 py-7 transition-colors hover:bg-current/3 motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2"
          key={opening.id}
          title={opening.title}
        >
          <div className="flex min-w-0 max-w-3xl flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              {opening.department ? (
                <span className="inline-flex rounded-full border border-current/20 bg-current/5 px-2.5 py-0.5 text-xs font-medium text-current">
                  {opening.department}
                </span>
              ) : null}
              {opening.reference || opening.posted ? (
                <span className={cn(contentItemMetadataClasses, 'opacity-60')}>
                  {joinMeta(opening.reference, postedLabel(opening.posted))}
                </span>
              ) : null}
            </div>
            <p className="font-sans text-md font-semibold leading-tight text-current sm:text-lg">
              {opening.title}
            </p>
            {opening.summary ? (
              <p className="text-sm leading-6 text-current/70">{opening.summary}</p>
            ) : null}
            {opening.location || opening.employment ? (
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-current/70">
                {opening.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden="true" className="size-3.5" />
                    {opening.location}
                  </span>
                ) : null}
                {opening.employment ? <span>{opening.employment}</span> : null}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-5 sm:justify-end">
            <ApplyBy date={opening.applyBy} />
            {opening.action ? <Arrow /> : null}
          </div>
        </RowShell>
      ))}
    </ul>
  )
}

/** Register: grouped rows with a location/posts column and the date on the right (Option A). */
function RegisterRow({ opening }: { opening: Opening }) {
  return (
    <RowShell
      action={opening.action}
      className="grid items-center gap-x-10 gap-y-3 px-1 py-6 transition-colors hover:bg-current/3 motion-reduce:transition-none lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto]"
      title={opening.title}
    >
      <div className="min-w-0">
        <p className="font-sans text-md font-semibold leading-tight text-current sm:text-lg">
          {opening.title}
        </p>
        {joinMeta(opening.department, opening.employment, postedLabel(opening.posted)) ? (
          <p className="mt-1.5 text-sm leading-6 text-current/70">
            {joinMeta(opening.department, opening.employment, postedLabel(opening.posted))}
          </p>
        ) : null}
      </div>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-current/70">
        {opening.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            {opening.location}
          </span>
        ) : null}
        {opening.positions ? (
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5" />
            {opening.positions}
          </span>
        ) : null}
      </p>
      <ApplyBy date={opening.applyBy} />
      {opening.action ? <Arrow className="max-lg:hidden" /> : <span aria-hidden="true" />}
    </RowShell>
  )
}

/** Ledger: the quietest rows, title plus one meta line and the closing date (Option E). */
function LedgerRow({ opening }: { opening: Opening }) {
  return (
    <RowShell
      action={opening.action}
      className="grid items-center gap-x-10 gap-y-3 py-6 transition-colors hover:bg-current/3 motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_auto_1rem]"
      title={opening.title}
    >
      <div className="min-w-0">
        <p className="font-sans text-md font-semibold leading-tight text-current sm:text-lg">
          {opening.title}
        </p>
        {joinMeta(opening.department, opening.employment, postedLabel(opening.posted)) ? (
          <p className="mt-1.5 text-sm leading-6 text-current/70">
            {joinMeta(opening.department, opening.employment, postedLabel(opening.posted))}
          </p>
        ) : null}
      </div>
      <ApplyBy date={opening.applyBy} />
      {opening.action ? (
        <Arrow className="opacity-60 group-hover:opacity-100 max-sm:hidden" />
      ) : (
        <span aria-hidden="true" />
      )}
    </RowShell>
  )
}

/** Departments: the group name sits in a left column beside its roles (Option F). */
function DepartmentRow({ opening }: { opening: Opening }) {
  return (
    <RowShell
      action={opening.action}
      className="grid items-center gap-x-10 gap-y-2 py-5 transition-colors hover:bg-current/3 motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_auto]"
      title={opening.title}
    >
      <div className="min-w-0">
        <p className="font-sans text-md font-semibold leading-tight text-current sm:text-lg">
          {opening.title}
        </p>
        {joinMeta(opening.department, opening.employment, postedLabel(opening.posted)) ? (
          <p className="mt-1.5 text-sm leading-6 text-current/70">
            {joinMeta(opening.department, opening.employment, postedLabel(opening.posted))}
          </p>
        ) : null}
      </div>
      <span className="inline-flex items-center gap-2.5">
        <ApplyBy date={opening.applyBy} inline />
        {opening.action ? <Arrow /> : null}
      </span>
    </RowShell>
  )
}

export function CareersBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  emptyMessage,
  eyebrow,
  footerActions,
  groups,
  layout = 'register',
  note,
  openings,
  showCount = true,
  showGroupNumbers = true,
  size = 'default',
  title,
}: CareersBlockLike) {
  const resolvedLayout: CareersLayout = layout ?? 'register'
  const items = resolveCareersOpenings(openings, groups)
  const sections = groupOpenings(items, groups)
  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const surface: BlockBackground = appearance?.background ?? 'none'
  const isCenter = resolvedLayout === 'notice' || contentAlignment === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedTitle = text(title)
  const resolvedAccent = text(accentTitle)
  const resolvedEyebrow = text(eyebrow)
  const resolvedDescription = text(description)
  const resolvedNote = text(note)
  const hasHeader =
    resolvedEyebrow || resolvedTitle || resolvedDescription || resolvedActions.length > 0
  const countLabel =
    showCount !== false && items.length
      ? `${items.length} open ${items.length === 1 ? 'position' : 'positions'}`
      : undefined
  const numbered = showGroupNumbers !== false

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-careers-layout={resolvedLayout}
    >
      <div className={regularBlockContainerClasses}>
        {hasHeader ? (
          <div
            className={cn(
              'mb-12 flex flex-col gap-5 sm:mb-14',
              !isCenter && countLabel && 'lg:flex-row lg:items-end lg:justify-between',
            )}
          >
            <div
              className={cn(
                'flex max-w-3xl flex-col gap-4',
                isCenter ? 'mx-auto items-center text-center' : 'items-start',
              )}
            >
              {resolvedEyebrow ? (
                <SectionEyebrow surface={surface}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}
              {resolvedTitle ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedAccent ? (
                    <>
                      <span className="block font-[inherit]">{resolvedTitle}</span>
                      <em className="block font-[inherit]">{resolvedAccent}</em>
                    </>
                  ) : (
                    resolvedTitle
                  )}
                </h2>
              ) : null}
              {resolvedDescription ? (
                <p className={cn(contentSectionDescriptionClasses, 'text-current/70')}>
                  {resolvedDescription}
                </p>
              ) : null}
              {resolvedActions.length > 0 ? (
                <div className="mt-2">
                  <ContentActions
                    actions={resolvedActions}
                    alignment={isCenter ? 'center' : 'left'}
                  />
                </div>
              ) : null}
            </div>
            {countLabel ? (
              <p
                className={cn(
                  contentItemMetadataClasses,
                  'uppercase opacity-60',
                  isCenter ? 'text-center' : 'lg:shrink-0 lg:pb-1',
                )}
              >
                {countLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {!items.length ? (
          <p
            className="rounded-card border border-dashed border-current/20 px-6 py-10 text-center text-sm leading-6 text-current/70"
            data-careers-empty="true"
          >
            {text(emptyMessage) ?? 'There are no open positions at the moment.'}
          </p>
        ) : resolvedLayout === 'notice' ? (
          <NoticeList openings={items} />
        ) : resolvedLayout === 'departments' ? (
          <div className="border-t border-current/20">
            {sections.map((group, index) => (
              <section
                aria-label={group.name}
                className="grid gap-x-16 gap-y-6 border-b border-current/20 py-10 md:grid-cols-[16rem_minmax(0,1fr)]"
                key={group.name}
              >
                <h3 className="font-sans text-lg font-semibold leading-tight text-current sm:text-xl">
                  {numbered ? (
                    <span
                      className="mb-2 block font-mono text-xs font-medium tracking-[0.14em] text-current"
                      data-section-eyebrow-surface={surface}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  ) : null}
                  {group.name}
                  <span
                    className={cn(contentItemMetadataClasses, 'mt-2 block uppercase opacity-60')}
                  >
                    {group.items.length} {group.items.length === 1 ? 'opening' : 'openings'}
                  </span>
                </h3>
                {/* Pull the list up by one row padding so the first title aligns with the group name. */}
                <ul className="-my-5 divide-y divide-current/10">
                  {group.items.map((opening) => (
                    <DepartmentRow key={opening.id} opening={opening} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-14">
            {sections.map((group, index) => (
              <section aria-label={group.name} key={group.name}>
                <GroupHeading
                  count={group.items.length}
                  index={index}
                  name={group.name}
                  numbered={numbered}
                  surface={surface}
                />
                <ul className="divide-y divide-current/10 border-b border-current/10">
                  {group.items.map((opening) =>
                    resolvedLayout === 'ledger' ? (
                      <LedgerRow key={opening.id} opening={opening} />
                    ) : (
                      <RegisterRow key={opening.id} opening={opening} />
                    ),
                  )}
                </ul>
              </section>
            ))}
          </div>
        )}

        {resolvedNote ? (
          <p
            className={cn(
              'mt-12 border-t border-current/10 pt-7 text-sm leading-6 text-current/70',
              isCenter && 'text-center',
            )}
          >
            <Linked text={resolvedNote} />
          </p>
        ) : null}
        <BlockFooterActions actions={footerActions} alignment={isCenter ? 'center' : 'left'} />
      </div>
    </section>
  )
}

// Web and e-mail addresses in the closing note become links; everything else stays text.
const linkPattern = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
function Linked({ text: value }: { text: string }) {
  const parts = value.split(linkPattern)
  if (parts.length === 1) return <>{value}</>
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0 || !part) return part
        const href = part.includes('@')
          ? `mailto:${part}`
          : part.startsWith('www.')
            ? `https://${part}`
            : part
        return (
          <a
            className="font-medium text-current underline decoration-current/40 underline-offset-4 hover:decoration-current"
            href={href}
            key={i}
            {...(href.startsWith('mailto:')
              ? {}
              : { rel: 'noopener noreferrer', target: '_blank' })}
          >
            {part}
          </a>
        )
      })}
    </>
  )
}

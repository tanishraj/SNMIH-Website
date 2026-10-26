'use client'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  SearchIcon,
} from 'lucide-react'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  contentIntroClasses,
  contentSectionHeadingClasses,
  contentSectionDescriptionClasses,
} from '@/blocks/shared/contentStyles'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { resolveCmsActions } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'
import {
  defaultEmptyDescription,
  defaultSections,
  displayValue,
  missingKind,
  normalizeLimit,
  normalizeSections,
  relationshipID,
  type Batch,
  type DisclosureBlockLike,
  type Group,
  type Row,
  type Snapshot,
} from './shared'

// Lines, tints and badges derive from the text colour, so they read on light and brand surfaces alike.
const control =
  'min-h-11 rounded-control border border-current/20 bg-transparent px-3 py-2 text-sm transition-colors hover:border-current/35 hover:bg-current/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:hover:bg-transparent'
const emptyBatch: Batch = { rows: [], total: 0, page: 1, totalPages: 1 }
type MissingStyle = 'chip' | 'footnote' | 'text'
function Value({
  value,
  state,
  missing,
  style,
}: {
  value?: string | null
  state?: string | null
  missing: string
  style: MissingStyle
}) {
  const kind = missingKind(value, state)
  if (!kind) return <>{value}</>
  const label = kind === 'notApplicable' ? 'Not applicable' : missing
  if (style === 'chip')
    return (
      <span
        className={cn(
          'inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-sans text-xs font-medium text-current/70',
          kind === 'notApplicable'
            ? 'border border-current/20 bg-current/5'
            : 'border border-dashed border-current/45',
        )}
      >
        {label}
      </span>
    )
  if (style === 'footnote' && kind === 'notSupplied')
    return (
      <>
        <span aria-hidden="true" className="opacity-70">
          —
        </span>
        <sup aria-hidden="true" className="ml-0.5 font-mono text-[11px] font-semibold">
          a
        </sup>
        <span className="sr-only">{label}</span>
      </>
    )
  return <span className="font-sans text-sm font-normal opacity-70">{label}</span>
}
const hasNotSupplied = (rows: Row[]) =>
  rows.some(
    (row) =>
      (!row.cells?.length && missingKind(row.value, row.valueState) === 'notSupplied') ||
      row.cells?.some((cell) => missingKind(cell.value, cell.valueState) === 'notSupplied'),
  )
const pulsePath = 'M2 34 H66 L74 26 L80 34 H92 L101 6 L110 54 L119 20 L125 34 H198'
// A heartbeat trace while a section loads; reduced motion keeps only the still track.
function PulseLoader() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-card border border-dashed border-current/20">
      <svg
        viewBox="0 0 200 60"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-16 w-56"
        aria-hidden="true"
      >
        <path d={pulsePath} stroke="currentColor" strokeOpacity={0.12} strokeWidth={4} />
        <g className="motion-reduce:hidden">
          <path
            d={pulsePath}
            pathLength={100}
            stroke="currentColor"
            strokeWidth={4.5}
            strokeDasharray="18 200"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="18;-100"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </path>
          <circle r={3.6} className="fill-background" stroke="currentColor" strokeWidth={1.6}>
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              path={pulsePath}
              keyPoints="0;1;1"
              keyTimes="0;0.847;1"
              calcMode="linear"
            />
          </circle>
        </g>
      </svg>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
        Loading records
      </span>
    </div>
  )
}
function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-current/20 px-6 py-12 text-center">
      <span className="mb-3.5 flex size-16 items-center justify-center rounded-full bg-current/[0.07] ring-[10px] ring-current/[0.03]">
        <ClipboardListIcon aria-hidden="true" className="size-7" strokeWidth={1.6} />
      </span>
      <p className="text-[17px] font-semibold leading-snug">{title}</p>
      {description && <p className="max-w-[44ch] text-sm leading-6 opacity-70">{description}</p>}
    </div>
  )
}
// Waits before showing a loader so quick responses never flash it, then keeps it long enough to read.
function useDelayedFlag(active: boolean, delay = 250, minimum = 600) {
  const [shown, setShown] = useState(false)
  const since = useRef(0)
  useEffect(() => {
    if (active) {
      if (shown) return
      const timer = setTimeout(() => {
        since.current = Date.now()
        setShown(true)
      }, delay)
      return () => clearTimeout(timer)
    }
    if (!shown) return
    const timer = setTimeout(
      () => setShown(false),
      Math.max(0, minimum - (Date.now() - since.current)),
    )
    return () => clearTimeout(timer)
  }, [active, delay, minimum, shown])
  return shown
}
const periodYear = (label: string) => label.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? ''
type Props = DisclosureBlockLike & {
  initial?: Snapshot
  draft?: boolean
  timeZone?: string
  staticPreview?: boolean
}
export function DisclosurePresentation(props: Props) {
  return (
    <DisclosureDirectory
      key={JSON.stringify([
        relationshipID(props.dataset),
        props.sections,
        props.defaultSection,
        props.itemsPerPage,
      ])}
      {...props}
    />
  )
}
function RowDetails({ row, missing }: { row: Row; missing: string }) {
  return row.details?.length ? (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-medium underline-offset-4 hover:underline">
        View details
      </summary>
      <dl className="mt-3 space-y-2">
        {row.details.map((detail, i) => (
          <div key={i}>
            <dt className="text-xs font-medium">{detail.label}</dt>
            <dd className="whitespace-pre-line text-sm opacity-80">
              {displayValue(detail.value, null, missing)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  ) : null
}
function GroupContent({
  group,
  batch,
  compact,
  missing,
  missingStyle,
  indexStart,
  accent,
  background,
}: {
  group: Group
  batch: Batch
  compact: boolean
  missing: string
  missingStyle: MissingStyle
  indexStart: number
  accent: string
  background: BlockBackground
}) {
  const pad = compact ? 'px-3 py-2.5' : 'px-3 py-4'
  if (group.layout === 'metrics')
    return (
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] overflow-hidden border-y border-t-current/20 border-b-current/10">
        {batch.rows.map((row) => (
          // Inset shadows draw the dividers; the list clips them on the outer edge.
          <div
            key={row.id}
            className="flex flex-col gap-2 px-3 py-5 sm:px-5 sm:first:pl-3 [box-shadow:-1px_0_0_color-mix(in_oklch,currentColor_10%,transparent)]"
          >
            <dt className="font-mono text-[11px] font-medium uppercase leading-4 tracking-[0.14em] opacity-70">
              {row.label}
            </dt>
            <dd
              className={cn(
                'whitespace-pre-line font-mono text-2xl font-medium tabular-nums sm:text-3xl',
                accent,
              )}
            >
              <Value
                value={row.value}
                state={row.valueState}
                missing={missing}
                style={missingStyle}
              />
            </dd>
            <RowDetails row={row} missing={missing} />
          </div>
        ))}
      </dl>
    )
  if (group.layout === 'facts')
    return (
      <dl className="border-t border-current/20">
        {batch.rows.map((row) => (
          <div
            key={row.id}
            className="grid border-b border-current/10 transition-colors hover:bg-current/[0.04] motion-reduce:transition-none sm:grid-cols-[35%_minmax(0,1fr)]"
          >
            <dt className={cn(pad, 'text-sm opacity-70 max-sm:pb-1')}>{row.label}</dt>
            <dd
              className={cn(
                pad,
                'min-w-0 whitespace-pre-line break-words text-sm font-medium max-sm:pt-0',
              )}
            >
              <Value
                value={row.value}
                state={row.valueState}
                missing={missing}
                style={missingStyle}
              />
              <RowDetails row={row} missing={missing} />
            </dd>
          </div>
        ))}
      </dl>
    )
  const columns = group.columns?.length
    ? group.columns
    : [{ key: 'label', label: 'Record', numeric: false }]
  const cellPad = compact ? 'px-3.5 py-2.5' : 'px-3.5 py-3.5'
  return (
    <div
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
      role="region"
      aria-label={group.title || 'Disclosure table'}
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-12 border-b border-current/20 py-2.5 pl-3.5">
              <span className="sr-only">Row</span>
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap border-b border-current/20 px-3.5 py-2.5 font-mono text-xs font-medium uppercase tracking-wide text-current/70',
                  c.numeric && 'text-right',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batch.rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className="transition-colors hover:bg-current/[0.04] motion-reduce:transition-none"
            >
              <td className={cn(cellPad, 'w-12 border-b border-current/10 pr-0 align-middle')}>
                <span
                  data-section-eyebrow-surface={background}
                  className="font-mono text-xs font-medium text-current"
                >
                  {String(indexStart + rowIndex + 1).padStart(2, '0')}
                </span>
              </td>
              {columns.map((c, index) => {
                const cell = row.cells?.find((item) => item.key === c.key)
                const provided = c.key !== 'label' && !missingKind(cell?.value, cell?.valueState)
                return (
                  <td
                    key={c.key}
                    className={cn(
                      cellPad,
                      'min-w-28 border-b border-current/10 align-middle',
                      index === 0 && 'font-semibold',
                      c.numeric && 'text-right',
                    )}
                  >
                    <div className="max-w-prose whitespace-pre-line break-words">
                      {c.key === 'label' ? (
                        row.label
                      ) : c.numeric && provided ? (
                        <span
                          className={cn(
                            'inline-block min-w-[30px] rounded-full bg-current/[0.08] px-2.5 py-0.5 text-center font-mono text-[13px] font-semibold tabular-nums',
                            accent,
                          )}
                        >
                          {cell?.value}
                        </span>
                      ) : (
                        <Value
                          value={cell?.value}
                          state={cell?.valueState}
                          missing={missing}
                          style={missingStyle}
                        />
                      )}
                    </div>
                    {index === 0 && <RowDetails row={row} missing={missing} />}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function DisclosureDirectory(props: Props) {
  const { initial, draft = false, staticPreview = false } = props
  const sections = normalizeSections(props.sections)
  const first =
    sections.find((s) => s.key === props.defaultSection) ?? sections[0] ?? defaultSections[0]
  const dataset = relationshipID(props.dataset)
  const [sectionKey, setSectionKey] = useState(first.key)
  const section = sections.find((s) => s.key === sectionKey) ?? first
  const [period, setPeriod] = useState(initial?.period ?? '')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [periodSearch, setPeriodSearch] = useState('')
  const [periodOpen, setPeriodOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot | undefined>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const controller = useRef<AbortController | null>(null)
  const serial = useRef(0)
  const limit = normalizeLimit(props.itemsPerPage)
  const requestKey = JSON.stringify([dataset, sectionKey, period, query, retry])
  const lastKey = useRef(initial ? requestKey : '')
  const appearance = resolveBlockAppearanceClasses(props.appearance)
  const brand = appearance.surface === 'brand'
  const accent = brand ? '' : 'text-primary'
  const missing = props.missingMessage?.trim() || 'Not supplied'
  const empty =
    props.emptyMessage?.trim() || 'No information is available for this reporting period.'
  const emptyDescription =
    props.emptyDescription == null ? defaultEmptyDescription : props.emptyDescription.trim()
  const alignment = props.contentAlignment === 'center' ? 'center' : 'left'
  const stackedHeader = alignment === 'center' || props.headerLayout === 'stacked'
  const missingStyle: MissingStyle =
    props.missingValueStyle === 'footnote' || props.missingValueStyle === 'text'
      ? props.missingValueStyle
      : 'chip'
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 250)
    return () => clearTimeout(timer)
  }, [input])
  // Cancel requests on unmount, and ignore responses belonging to earlier filter states.
  useEffect(
    () => () => {
      controller.current?.abort()
      serial.current++
    },
    [],
  )
  async function fetchData(groupKey?: string, page = 1, periodPage = 1, findPeriod = '') {
    if (!dataset || staticPreview || !section.groups.length) return
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    const version = ++serial.current
    setBusy(true)
    setError('')
    const params = new URLSearchParams({
      dataset,
      section: section.key,
      groups: groupKey || section.groups.map((g) => g.key).join(','),
      page: String(page),
      limit: String(limit),
      periodPage: String(periodPage),
      periodQuery: findPeriod,
      q: query,
      draft: String(draft),
    })
    if (period || snapshot?.period) params.set('period', period || snapshot!.period)
    try {
      const response = await fetch('/api/disclosure-data?' + params, {
        signal: abort.signal,
        cache: 'no-store',
        credentials: 'same-origin',
      })
      const next = (await response.json()) as Snapshot & { message?: string }
      if (!response.ok) throw new Error(next.message || 'Unable to load disclosure information.')
      if (version !== serial.current) return
      setSnapshot((previous) => {
        if (!previous) return next
        const periods =
          periodPage > 1
            ? [
                ...previous.periods,
                ...next.periods.filter((p) => !previous.periods.some((old) => old.id === p.id)),
              ]
            : next.periods
        const selected = previous.periods.find((p) => p.id === period)
        if (selected && !periods.some((p) => p.id === selected.id)) periods.unshift(selected)
        const groups = groupKey ? { ...previous.groups, ...next.groups } : next.groups
        if (groupKey && props.paginationMode === 'loadMore' && page > 1)
          groups[groupKey] = {
            ...next.groups[groupKey],
            rows: [...(previous.groups[groupKey]?.rows ?? []), ...next.groups[groupKey].rows],
          }
        return { ...next, periods, groups }
      })
    } catch (e) {
      if (!abort.signal.aborted && version === serial.current)
        setError(e instanceof Error ? e.message : 'Unable to load disclosure information.')
    } finally {
      if (version === serial.current) setBusy(false)
    }
  }
  const loadCurrent = useEffectEvent(() => {
    void fetchData()
  })
  useEffect(() => {
    if (lastKey.current === requestKey) return
    lastKey.current = requestKey
    loadCurrent()
  }, [requestKey])
  const pageStampNewer =
    props.publicUpdatedAt && (!snapshot?.updatedAt || props.publicUpdatedAt > snapshot.updatedAt)
  const updatedDate = pageStampNewer ? props.publicUpdatedAt : snapshot?.updatedAt
  const updatedLabel = updatedDate
    ? pageStampNewer
      ? new Intl.DateTimeFormat('en-IN', {
          timeZone: props.timeZone || snapshot?.timeZone || 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(updatedDate))
      : snapshot?.updatedLabel
    : null
  const selectedPeriod = period || snapshot?.period || ''
  const periodLabel = snapshot?.periods.find((p) => p.id === selectedPeriod)?.label ?? ''
  const periodGroups = (snapshot?.periods ?? []).reduce<
    { year: string; periods: Snapshot['periods'] }[]
  >((groups, p) => {
    const year = periodYear(p.label)
    const last = groups.at(-1)
    if (last && last.year === year) last.periods.push(p)
    else groups.push({ year, periods: [p] })
    return groups
  }, [])
  const hasRows = section.groups.some((g) => (snapshot?.groups[g.key]?.total ?? 0) > 0)
  const loading = useDelayedFlag(busy && !hasRows)
  if (!sections.length || (!dataset && !draft)) return null
  return (
    <section
      data-disclosure-proforma="true"
      data-block-surface={appearance.surface}
      className={cn(
        regularBlockMobilePaddingClasses[props.size ?? 'default'],
        appearance.className,
      )}
    >
      <div className={regularBlockContainerClasses}>
        <div
          className={cn(
            'mb-8 flex flex-col gap-5',
            !stackedHeader && 'lg:flex-row lg:items-end lg:justify-between',
            alignment === 'center' && 'items-center text-center',
          )}
        >
          <div className={cn(contentIntroClasses, alignment === 'center' && 'items-center')}>
            {props.eyebrow && (
              <SectionEyebrow surface={appearance.background}>{props.eyebrow}</SectionEyebrow>
            )}
            {props.title && (
              <h2 className={contentSectionHeadingClasses}>
                {props.title}
                {props.accentTitle && <em className="block">{props.accentTitle}</em>}
              </h2>
            )}
            {props.description && (
              <p className={contentSectionDescriptionClasses}>{props.description}</p>
            )}
            <ContentActions actions={resolveCmsActions(props.actions)} alignment={alignment} />
          </div>
          <p className="shrink-0 text-sm leading-6">
            {updatedLabel ? (
              <>
                <span className="opacity-70">Last updated </span>
                <time dateTime={updatedDate!} className="font-medium">
                  {updatedLabel}
                </time>
              </>
            ) : (
              <span className="opacity-70">Publication details pending</span>
            )}
            {draft && <span className="font-medium"> · Draft preview</span>}
          </p>
        </div>
        <div
          className={cn(
            'grid gap-8 border-t border-current/10 pt-7 lg:gap-0',
            props.sidebarWidth === 'standard'
              ? 'lg:grid-cols-[220px_minmax(0,1fr)]'
              : 'lg:grid-cols-[260px_minmax(0,1fr)]',
          )}
        >
          <nav
            aria-label="Disclosure sections"
            className="flex flex-wrap content-start gap-1 lg:sticky lg:top-26 lg:flex-col lg:self-start lg:pr-6"
          >
            {sections.map((s, index) => {
              const active = s.key === sectionKey
              return (
                <button
                  type="button"
                  key={s.key}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-12 items-center gap-3 border-l-[3px] px-3 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
                    active
                      ? cn(
                          'bg-linear-to-r from-current/10 to-transparent to-90% font-semibold',
                          brand ? 'border-current' : 'border-primary text-primary',
                        )
                      : cn(
                          'border-transparent text-current/75 hover:text-current',
                          !brand && 'hover:text-primary',
                        ),
                  )}
                  onClick={() => {
                    if (active) return
                    controller.current?.abort()
                    serial.current++
                    setSectionKey(s.key)
                    setInput('')
                    setQuery('')
                    setSnapshot((old) => (old ? { ...old, groups: {} } : old))
                  }}
                >
                  {props.showSectionNumbers !== false && (
                    // The active number shares the eyebrow's per-surface green, like other SNMIH ordinals.
                    <span
                      data-section-eyebrow-surface={active ? appearance.background : undefined}
                      className={cn(
                        'font-mono text-xs font-medium',
                        active ? 'text-current' : 'opacity-60',
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                  {s.label}
                </button>
              )
            })}
            {props.archiveNote && (
              <p className="mt-5 hidden border-t border-current/10 px-3 pt-5 text-sm leading-6 opacity-70 lg:block">
                {props.archiveNote}
              </p>
            )}
          </nav>
          <div className="min-w-0 lg:border-l lg:border-current/10 lg:pl-8">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-56 flex-1">
                <h3 className="font-display text-2xl font-semibold">{section.label}</h3>
                {section.description && (
                  <p className="mt-2 text-sm leading-6 opacity-70">{section.description}</p>
                )}
              </div>
              <div
                role="group"
                aria-label="Search this section or choose a reporting period"
                className="flex min-h-11 w-full items-stretch rounded-control border border-current/20 transition-[border-color,box-shadow] focus-within:border-current focus-within:ring-3 focus-within:ring-current/10 hover:border-current/35 sm:w-auto"
              >
                <label className="relative flex min-w-0 flex-1 items-center sm:w-80 sm:flex-none">
                  <span className="sr-only">Search this section</span>
                  <SearchIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 size-4 opacity-60"
                  />
                  <input
                    className="h-full w-full min-w-0 rounded-l-control bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-current/60"
                    value={input}
                    maxLength={100}
                    placeholder="Name, topic or department"
                    onChange={(e) => setInput(e.target.value)}
                  />
                </label>
                <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!snapshot?.periods.length}
                      aria-label={'Reporting period: ' + (periodLabel || 'none published')}
                      className="flex shrink-0 items-center gap-2 rounded-r-control border-l border-current/20 px-3 text-sm font-medium transition-colors hover:bg-current/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                    >
                      <CalendarIcon aria-hidden="true" className="size-4 opacity-60" />
                      {periodLabel || 'No reporting periods'}
                      <ChevronDownIcon aria-hidden="true" className="size-4 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-66 gap-1.5 rounded-card border border-primary/15 bg-popover/30 p-2.5 shadow-[0_18px_36px_-16px_color-mix(in_oklch,var(--primary)_30%,transparent),0_2px_6px_-2px_rgb(0_0_0/0.08)] ring-0 backdrop-blur-lg"
                  >
                    <p className="px-1 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Reporting period
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        void fetchData(undefined, 1, 1, periodSearch)
                      }}
                    >
                      <label className="relative block">
                        <span className="sr-only">Find a reporting period</span>
                        <SearchIcon
                          aria-hidden="true"
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          className="h-[34px] w-full rounded-control border border-primary/15 bg-popover/45 pl-8 pr-2.5 text-[13px] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/45 focus:ring-3 focus:ring-primary/10"
                          value={periodSearch}
                          maxLength={100}
                          placeholder="e.g. August 2026"
                          onChange={(e) => setPeriodSearch(e.target.value)}
                        />
                      </label>
                    </form>
                    <div className="max-h-64 overflow-y-auto">
                      {periodGroups.map((group) => (
                        <div key={group.year || 'periods'}>
                          {group.year && (
                            <p className="px-2 pb-1 pt-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                              {group.year}
                            </p>
                          )}
                          <ul
                            aria-label={group.year || 'Reporting periods'}
                            className="flex flex-col gap-0.5"
                          >
                            {group.periods.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  aria-current={p.id === selectedPeriod ? 'true' : undefined}
                                  className="flex h-9 w-full items-center justify-between gap-2 rounded-control px-2.5 text-left text-[13.5px] transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring aria-[current=true]:bg-primary/8 aria-[current=true]:font-semibold aria-[current=true]:text-primary"
                                  onClick={() => {
                                    setPeriodOpen(false)
                                    if (p.id === selectedPeriod) return
                                    setPeriod(p.id)
                                    setSnapshot((old) => (old ? { ...old, groups: {} } : old))
                                  }}
                                >
                                  {p.label}
                                  {p.id === selectedPeriod && (
                                    <CheckIcon aria-hidden="true" className="size-4 text-success" />
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {snapshot?.hasMorePeriods ? (
                      <button
                        type="button"
                        className="mt-1 h-9 rounded-control border-t border-primary/10 text-[13px] font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
                        disabled={busy}
                        onClick={() =>
                          void fetchData(undefined, 1, snapshot.periodPage + 1, periodSearch)
                        }
                      >
                        Load earlier periods
                      </button>
                    ) : (
                      <p className="mt-1 border-t border-primary/10 px-1.5 pt-2 text-xs leading-snug text-muted-foreground">
                        Earlier periods appear here once published.
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div role="status" className="sr-only" aria-live="polite">
              {busy ? 'Loading disclosure information…' : ''}
            </div>
            {error && (
              <div role="alert" className="my-4 rounded-control border border-current/20 p-4">
                <p>{error}</p>
                <button className={cn(control, 'mt-3')} onClick={() => setRetry((n) => n + 1)}>
                  Retry
                </button>
              </div>
            )}
            {loading && <PulseLoader />}
            {!loading && !busy && !error && !hasRows && (
              <EmptyState
                title={
                  !dataset && draft ? 'Select a Disclosure Dataset in the block settings.' : empty
                }
                description={!dataset && draft ? undefined : emptyDescription}
              />
            )}
            {!loading && (
              <div aria-busy={busy} className="space-y-8">
                {section.groups.map((group) => {
                  const batch = snapshot?.groups[group.key] ?? emptyBatch
                  if (!batch.total) return null
                  return (
                    <section key={group.key} aria-label={group.title || section.label}>
                      {group.title && (
                        <h4 className="mb-4 font-sans text-lg font-semibold sm:text-xl">
                          {group.title}
                        </h4>
                      )}
                      <GroupContent
                        group={group}
                        batch={batch}
                        compact={props.density === 'compact'}
                        missing={missing}
                        missingStyle={missingStyle}
                        indexStart={
                          props.paginationMode === 'loadMore' ? 0 : (batch.page - 1) * limit
                        }
                        accent={accent}
                        background={appearance.background}
                      />
                      {missingStyle === 'footnote' && hasNotSupplied(batch.rows) && (
                        <p className="mt-3 text-[13px] leading-5 opacity-75">
                          <sup className="mr-1.5 font-mono text-[11px] font-semibold">a</sup>
                          {missing}
                          {periodLabel ? ' for ' + periodLabel : ''}.
                        </p>
                      )}
                      {batch.total > limit && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                          <p>
                            Showing{' '}
                            {props.paginationMode === 'loadMore'
                              ? 1
                              : (batch.page - 1) * limit + 1}
                            –{Math.min(batch.page * limit, batch.total)} of {batch.total}
                          </p>
                          {props.paginationMode === 'loadMore' ? (
                            batch.page < batch.totalPages && (
                              <button
                                className={control}
                                disabled={busy}
                                onClick={() => void fetchData(group.key, batch.page + 1)}
                              >
                                Load more
                              </button>
                            )
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                className={control}
                                disabled={busy || batch.page <= 1}
                                aria-label={'Previous page: ' + (group.title || section.label)}
                                onClick={() => void fetchData(group.key, batch.page - 1)}
                              >
                                Previous
                              </button>
                              <span>
                                {batch.page} / {batch.totalPages}
                              </span>
                              <button
                                className={control}
                                disabled={busy || batch.page >= batch.totalPages}
                                aria-label={'Next page: ' + (group.title || section.label)}
                                onClick={() => void fetchData(group.key, batch.page + 1)}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <BlockFooterActions actions={props.footerActions} alignment={alignment} />
      </div>
    </section>
  )
}

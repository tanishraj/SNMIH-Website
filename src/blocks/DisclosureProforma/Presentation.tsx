'use client'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { CalendarIcon, CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
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

const control =
  'min-h-11 rounded-control border border-border bg-card px-3 py-2 text-sm text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50'
const emptyBatch: Batch = { rows: [], total: 0, page: 1, totalPages: 1 }
type MissingStyle = 'chip' | 'footnote' | 'text'
// Missing values take their colour from the surrounding text so they stay legible on cards and brand surfaces.
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
          'inline-block whitespace-nowrap rounded-full px-2 py-0.5 font-sans text-xs font-medium opacity-75',
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
        <sup aria-hidden="true" className="ml-0.5 font-mono text-[11px] font-semibold text-primary">
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
}: {
  group: Group
  batch: Batch
  compact: boolean
  missing: string
  missingStyle: MissingStyle
}) {
  const pad = compact ? 'px-4 py-3' : 'px-5 py-4'
  if (group.layout === 'metrics')
    return (
      <dl className="grid overflow-hidden rounded-card border border-border bg-card text-card-foreground shadow-sm grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
        {batch.rows.map((row) => (
          // Inset shadows draw the dividers; the card clips them on the outer edges.
          <div
            key={row.id}
            className="flex flex-col gap-2 p-5 [box-shadow:-1px_0_0_var(--border),0_-1px_0_var(--border)]"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-pre-line font-mono text-2xl font-medium tabular-nums sm:text-3xl">
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
      <dl className="overflow-hidden rounded-card border border-border bg-card text-card-foreground shadow-sm">
        {batch.rows.map((row) => (
          <div
            key={row.id}
            className="relative grid border-b border-border transition-shadow last:border-0 hover:z-10 hover:shadow-md motion-reduce:transition-none sm:grid-cols-[35%_minmax(0,1fr)]"
          >
            <dt className={cn(pad, 'bg-muted/50 text-sm font-medium text-muted-foreground')}>
              {row.label}
            </dt>
            <dd className={cn(pad, 'min-w-0 whitespace-pre-line break-words text-sm')}>
              <span>
                <Value
                  value={row.value}
                  state={row.valueState}
                  missing={missing}
                  style={missingStyle}
                />
              </span>
              <RowDetails row={row} missing={missing} />
            </dd>
          </div>
        ))}
      </dl>
    )
  const columns = group.columns?.length
    ? group.columns
    : [{ key: 'label', label: 'Record', numeric: false }]
  return (
    <div
      className="overflow-x-auto rounded-card border border-border bg-muted/30 px-2 pb-1 focus-visible:outline-2 focus-visible:outline-ring"
      role="region"
      aria-label={group.title || 'Disclosure table'}
      tabIndex={0}
    >
      <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide',
                  c.numeric && 'text-right',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batch.rows.map((row) => (
            <tr
              key={row.id}
              className="group transition-[filter] hover:drop-shadow-sm motion-reduce:transition-none"
            >
              {columns.map((c, index) => (
                <td
                  key={c.key}
                  className={cn(
                    pad,
                    'min-w-28 border-y border-border bg-card text-card-foreground first:rounded-l-control first:border-l last:rounded-r-control last:border-r group-hover:bg-accent group-hover:text-accent-foreground',
                    c.numeric && 'text-right font-mono tabular-nums',
                  )}
                >
                  <div className="max-w-prose whitespace-pre-line break-words">
                    {c.key === 'label' ? (
                      row.label
                    ) : (
                      <Value
                        value={row.cells?.find((cell) => cell.key === c.key)?.value}
                        state={row.cells?.find((cell) => cell.key === c.key)?.valueState}
                        missing={missing}
                        style={missingStyle}
                      />
                    )}
                  </div>
                  {index === 0 && <RowDetails row={row} missing={missing} />}
                </td>
              ))}
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
  const controlsLabelId = useId()
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
  const missing = props.missingMessage?.trim() || 'Not supplied'
  const empty =
    props.emptyMessage?.trim() || 'No information is available for this reporting period.'
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
  const updatedBy = pageStampNewer ? props.publicUpdatedBy : snapshot?.updatedBy
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
  const hasRows = section.groups.some((g) => (snapshot?.groups[g.key]?.total ?? 0) > 0)
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
            !stackedHeader && 'lg:flex-row lg:items-start lg:justify-between',
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
          <dl
            className={cn(
              'grid shrink-0 grid-cols-[auto_auto] gap-x-5 gap-y-1 rounded-card border border-border bg-card px-5 py-4 text-left text-sm leading-6 text-card-foreground shadow-sm',
              alignment === 'center' ? 'self-center' : 'self-start',
            )}
          >
            <dt className="text-muted-foreground">Data as of</dt>
            <dd className="font-semibold text-primary">{periodLabel || 'Not published'}</dd>
            {updatedLabel ? (
              <>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd className="font-medium">
                  <time dateTime={updatedDate!}>{updatedLabel}</time>
                </dd>
                <dt className="text-muted-foreground">Updated by</dt>
                <dd className="font-medium">{updatedBy || 'Editorial team'}</dd>
              </>
            ) : (
              <>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd className="text-muted-foreground">Publication details pending</dd>
              </>
            )}
            {draft && <dd className="col-span-2 font-medium">Draft preview</dd>}
          </dl>
        </div>
        <div
          className={cn(
            'grid gap-8 border-t border-border pt-7',
            props.sidebarWidth === 'standard'
              ? 'lg:grid-cols-[220px_minmax(0,1fr)]'
              : 'lg:grid-cols-[260px_minmax(0,1fr)]',
          )}
        >
          <nav
            aria-label="Disclosure sections"
            className="flex flex-wrap content-start gap-1 lg:flex-col"
          >
            {sections.map((s, index) => (
              <button
                type="button"
                key={s.key}
                aria-pressed={s.key === sectionKey}
                className={cn(
                  'flex min-h-12 items-center gap-3 border-l-[3px] px-3 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none',
                  s.key === sectionKey
                    ? cn(
                        'font-semibold',
                        appearance.surface === 'brand'
                          ? 'border-current bg-white/10'
                          : 'border-primary bg-primary/5',
                      )
                    : 'border-transparent hover:bg-current/5',
                )}
                onClick={() => {
                  if (s.key === sectionKey) return
                  controller.current?.abort()
                  serial.current++
                  setSectionKey(s.key)
                  setInput('')
                  setQuery('')
                  setSnapshot((old) => (old ? { ...old, groups: {} } : old))
                }}
              >
                {props.showSectionNumbers !== false && (
                  // Shares the eyebrow's per-surface colour, like the ordinals in other SNMIH sections.
                  <span
                    data-section-eyebrow-surface={appearance.background}
                    className="font-mono text-xs font-medium text-current"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                {s.label}
              </button>
            ))}
            {props.archiveNote && (
              <p className="mt-5 hidden border-t border-border px-3 pt-5 text-sm leading-6 opacity-70 lg:block">
                {props.archiveNote}
              </p>
            )}
          </nav>
          <div className="min-w-0">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-56 flex-1">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {section.label}
                </h3>
                {section.description && (
                  <p className="mt-2 text-sm leading-6 opacity-70">{section.description}</p>
                )}
              </div>
              <div className="flex w-full min-w-0 flex-col gap-1.5 text-xs sm:w-auto">
                <span id={controlsLabelId}>Search this section or choose a reporting period</span>
                <div
                  role="group"
                  aria-labelledby={controlsLabelId}
                  className="flex min-h-11 w-full items-stretch rounded-control border border-border bg-card text-card-foreground sm:w-auto"
                >
                  <label className="relative flex min-w-0 flex-1 items-center sm:w-56 sm:flex-none">
                    <span className="sr-only">Search this section</span>
                    <SearchIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
                    />
                    <input
                      className="h-full w-full min-w-0 rounded-l-control bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
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
                        className="flex shrink-0 items-center gap-2 rounded-r-control border-l border-border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                      >
                        <CalendarIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                        {periodLabel || 'No reporting periods'}
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 gap-2 p-2">
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void fetchData(undefined, 1, 1, periodSearch)
                        }}
                      >
                        <input
                          className={cn(control, 'min-h-10 min-w-0 flex-1')}
                          aria-label="Find a reporting period"
                          value={periodSearch}
                          maxLength={100}
                          placeholder="e.g. August 2026"
                          onChange={(e) => setPeriodSearch(e.target.value)}
                        />
                        <button type="submit" className={cn(control, 'min-h-10')} disabled={busy}>
                          Find
                        </button>
                      </form>
                      <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                        {snapshot?.periods.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              aria-current={p.id === selectedPeriod ? 'true' : undefined}
                              className="flex min-h-10 w-full items-center justify-between gap-2 rounded-compact px-2.5 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring aria-[current=true]:bg-secondary aria-[current=true]:font-medium"
                              onClick={() => {
                                setPeriodOpen(false)
                                if (p.id === selectedPeriod) return
                                setPeriod(p.id)
                                setSnapshot((old) => (old ? { ...old, groups: {} } : old))
                              }}
                            >
                              {p.label}
                              {p.id === selectedPeriod && (
                                <CheckIcon aria-hidden="true" className="size-4" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {snapshot?.hasMorePeriods && (
                        <button
                          type="button"
                          className={cn(control, 'min-h-10')}
                          disabled={busy}
                          onClick={() =>
                            void fetchData(undefined, 1, snapshot.periodPage + 1, periodSearch)
                          }
                        >
                          Load earlier periods
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div role="status" className="text-sm" aria-live="polite">
              {busy ? 'Loading disclosure information…' : ''}
            </div>
            {error && (
              <div role="alert" className="my-4 rounded-control border border-border p-4">
                <p>{error}</p>
                <button className={cn(control, 'mt-3')} onClick={() => setRetry((n) => n + 1)}>
                  Retry
                </button>
              </div>
            )}
            {!busy && !error && !hasRows && (
              <p className="rounded-card border border-border bg-card p-6 text-sm text-card-foreground">
                {!dataset && draft ? 'Select a Disclosure Dataset in the block settings.' : empty}
              </p>
            )}
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
                          {props.paginationMode === 'loadMore' ? 1 : (batch.page - 1) * limit + 1}–
                          {Math.min(batch.page * limit, batch.total)} of {batch.total}
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
          </div>
        </div>
        <BlockFooterActions actions={props.footerActions} alignment={alignment} />
      </div>
    </section>
  )
}

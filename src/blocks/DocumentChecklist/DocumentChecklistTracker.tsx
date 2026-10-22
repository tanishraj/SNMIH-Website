'use client'

import { Check, Printer, RotateCcw } from 'lucide-react'
import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

import {
  formatChecklistMarker,
  getChecklistGridLayout,
  getChecklistStorageKey,
  parseStoredChecklistKeys,
  type DocumentChecklistColumns,
  type DocumentChecklistItem,
  type DocumentChecklistPresentation,
  type DocumentChecklistMarkerStyle,
  type DocumentChecklistNote,
} from './normalizeDocumentChecklist'

export type DocumentChecklistLayout = {
  checklistPosition: 'left' | 'right'
  mode: 'split' | 'stacked'
  proportion: 'balanced' | 'checklistFocus' | 'sectionFocus'
  verticalAlignment: 'bottom' | 'center' | 'top' | 'topStatic'
}

type DocumentChecklistTrackerProps = {
  columns: DocumentChecklistColumns
  enableTracking: boolean
  /** Rendered at the bottom of the introduction column in Split, or after the checklist when stacked. */
  bottomContent?: ReactNode
  header: ReactNode
  items: DocumentChecklistItem[]
  layout: DocumentChecklistLayout
  markerStyle: DocumentChecklistMarkerStyle
  notes: DocumentChecklistNote[]
  presentation: DocumentChecklistPresentation
  progressLabel: string
  sectionBackground: BlockBackground
  showPrintButton: boolean
  showProgressPanel: boolean
  sidebarBackground?: string | null
  storageId?: string | null
}

const splitGridClasses = (layout: DocumentChecklistLayout) => {
  const checklistOnLeft = layout.checklistPosition === 'left'

  if (layout.proportion === 'balanced') return 'lg:grid-cols-2'
  // Checklist Focus gives the checklist 60%; Section Content Focus gives it 40%.
  const checklistWide = layout.proportion === 'checklistFocus'

  return checklistOnLeft === checklistWide
    ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'
    : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'
}

const verticalAlignmentClasses = {
  top: 'lg:sticky lg:top-24 lg:self-start',
  topStatic: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
} as const

const sidebarLabelClasses = 'font-mono text-xs font-medium uppercase tracking-[0.14em]'

const storageChangeEvent = 'document-checklist:change'

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange)
  window.addEventListener(storageChangeEvent, onChange)

  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(storageChangeEvent, onChange)
  }
}

const readStoredValue = (storageKey: string | undefined) => {
  if (!storageKey) return null

  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

/** Returns false when ticks cannot be persisted, so the caller keeps them for this visit only. */
const writeStoredKeys = (storageKey: string | undefined, keys: readonly string[]) => {
  if (!storageKey) return false

  try {
    if (keys.length === 0) window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, JSON.stringify(keys))
    window.dispatchEvent(new Event(storageChangeEvent))
    return true
  } catch {
    return false
  }
}

function ChecklistMarker({
  index,
  markerStyle,
}: {
  index: number
  markerStyle: DocumentChecklistMarkerStyle
}) {
  if (markerStyle === 'check') {
    return (
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 items-center justify-center rounded-full border border-primary/40 text-primary"
      >
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="text-right font-mono text-xs leading-6 text-muted-foreground tabular-nums"
    >
      {formatChecklistMarker(index, markerStyle)}
    </span>
  )
}

export function DocumentChecklistTracker({
  columns,
  enableTracking,
  bottomContent,
  header,
  items,
  layout,
  markerStyle,
  notes,
  presentation,
  progressLabel,
  sectionBackground,
  showPrintButton,
  showProgressPanel,
  sidebarBackground,
  storageId,
}: DocumentChecklistTrackerProps) {
  const isSplit = layout.mode === 'split'
  const surface = resolveCardSurface(sidebarBackground, sectionBackground)
  const grid = getChecklistGridLayout(items.length, columns)
  const baseId = useId()
  const storageKey = getChecklistStorageKey(storageId)
  const itemKeys = items.map((item) => item.key)
  const storedValue = useSyncExternalStore(
    subscribeToStorage,
    () => readStoredValue(storageKey),
    () => null,
  )
  // Holds ticks only when storage is unavailable; otherwise storage is the single source of truth.
  const [unsavedKeys, setUnsavedKeys] = useState<string[] | null>(null)
  const checkedKeys = enableTracking
    ? (unsavedKeys ?? parseStoredChecklistKeys(storedValue, itemKeys))
    : []

  const updateCheckedKeys = (next: string[]) => {
    setUnsavedKeys(writeStoredKeys(storageKey, next) ? null : next)
  }

  const toggleItem = (key: string, checked: boolean) => {
    const withoutKey = checkedKeys.filter((existing) => existing !== key)
    updateCheckedKeys(checked ? [...withoutKey, key] : withoutKey)
  }

  const checkedSet = new Set(checkedKeys)
  const readyCount = itemKeys.filter((key) => checkedSet.has(key)).length
  const percent = Math.round((readyCount / items.length) * 100)
  const conditionalCount = items.filter((item) => item.qualifier).length
  const hasSidebar = showProgressPanel && (enableTracking || showPrintButton || notes.length > 0)
  const showClear = enableTracking && readyCount > 0
  // Check markers would duplicate the checkbox, so tracked lists drop that marker column.
  const showMarker = !(enableTracking && markerStyle === 'check')

  const printButtonClasses =
    'border-current/50 bg-transparent text-current hover:border-current hover:bg-current/10 hover:text-current'
  const clearButtonClasses = 'text-current hover:bg-current/10 hover:text-current'

  const isLedger = presentation === 'ledger'
  const isBrandSurface = resolveBlockSurface(sectionBackground) === 'brand'
  const documentSummary = `${items.length} ${items.length === 1 ? 'document' : 'documents'}${
    conditionalCount > 0 ? ` · ${conditionalCount} conditional` : ''
  }`

  const trackerList = (
    <div
      className="@container min-w-0 overflow-clip rounded-card border border-border bg-card text-card-foreground"
      data-document-checklist-tracking={enableTracking ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-3.5 sm:px-6">
        <p className={cn(sidebarLabelClasses, 'text-muted-foreground')}>{documentSummary}</p>
        {!hasSidebar && (enableTracking || showPrintButton) ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden">
            {enableTracking ? (
              <p
                aria-live="polite"
                className="flex items-center gap-2.5 text-sm font-medium text-card-foreground"
              >
                <span className="tabular-nums">
                  {readyCount} of {items.length} ready
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-1 w-24 overflow-hidden rounded-full bg-border sm:block"
                >
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </p>
            ) : null}
            {showClear ? (
              <Button onClick={() => updateCheckedKeys([])} size="xs" type="button" variant="ghost">
                <RotateCcw aria-hidden="true" />
                Clear
              </Button>
            ) : null}
            {showPrintButton ? (
              <Button onClick={() => window.print()} size="xs" type="button" variant="outline">
                <Printer aria-hidden="true" />
                Print
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <ol
        className={grid.container}
        data-document-checklist-columns={grid.usesThree ? 'three' : grid.usesTwo ? 'two' : 'one'}
        style={grid.style}
      >
        {items.map((item, index) => {
          const isChecked = checkedSet.has(item.key)
          const inputId = `${baseId}-${index}`
          const rowClasses = cn(
            'grid h-full items-start gap-x-3 px-5 py-3.5 sm:px-6',
            enableTracking
              ? showMarker
                ? 'grid-cols-[1.25rem_2.25rem_minmax(0,1fr)]'
                : 'grid-cols-[1.25rem_minmax(0,1fr)]'
              : markerStyle === 'check'
                ? 'grid-cols-[1.25rem_minmax(0,1fr)]'
                : 'grid-cols-[2.25rem_minmax(0,1fr)]',
            // Three columns can land in a narrow split column, so cells give back their padding.
            grid.usesThree && '@3xl:gap-x-2.5 @3xl:px-4',
            grid.usesThree &&
              showMarker &&
              (enableTracking
                ? '@3xl:grid-cols-[1.25rem_1.875rem_minmax(0,1fr)]'
                : '@3xl:grid-cols-[1.875rem_minmax(0,1fr)]'),
          )
          const content = (
            <>
              {showMarker ? <ChecklistMarker index={index} markerStyle={markerStyle} /> : null}
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={cn(
                    'font-sans text-base leading-6 font-medium text-card-foreground transition-colors motion-reduce:transition-none',
                    isChecked &&
                      'text-muted-foreground line-through decoration-muted-foreground/60',
                  )}
                >
                  {item.label}
                </span>
                {item.qualifier || item.details ? (
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {item.qualifier ? (
                      <span className="rounded-full border border-border px-2 py-px text-xs leading-5 whitespace-nowrap text-muted-foreground">
                        {item.qualifier}
                      </span>
                    ) : null}
                    {item.details ? (
                      <span className="text-sm leading-6 text-muted-foreground">
                        {item.details}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
            </>
          )

          return (
            <li
              key={item.key}
              className={cn('min-w-0 border-border', grid.item(index))}
              data-checked={isChecked || undefined}
            >
              {enableTracking ? (
                <label
                  className={cn(
                    rowClasses,
                    'cursor-pointer transition-colors hover:bg-accent/35 motion-reduce:transition-none',
                  )}
                  htmlFor={inputId}
                >
                  <Checkbox
                    checked={isChecked}
                    className="mt-0.5 size-5 border-muted-foreground/45 bg-card data-checked:border-primary"
                    id={inputId}
                    onCheckedChange={(value) => toggleItem(item.key, value === true)}
                  />
                  {content}
                </label>
              ) : (
                <div className={rowClasses}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )

  const ledgerAccent = isBrandSurface ? 'text-current' : 'text-primary'
  const ledgerList = (
    <div
      className="@container flex min-w-0 flex-col gap-5 text-current"
      data-document-checklist-tracking={enableTracking ? 'true' : 'false'}
    >
      {!hasSidebar && (enableTracking || showPrintButton) ? (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 print:hidden">
          <p className={cn(sidebarLabelClasses, 'text-current/70')}>{documentSummary}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {enableTracking ? (
              <p aria-live="polite" className="flex items-center gap-2.5 text-sm font-medium">
                <span className="tabular-nums">
                  {readyCount} of {items.length} ready
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-px w-24 overflow-hidden bg-current/20 sm:block"
                >
                  <span
                    className="block h-full bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </p>
            ) : null}
            {showClear ? (
              <Button
                className={clearButtonClasses}
                onClick={() => updateCheckedKeys([])}
                size="xs"
                type="button"
                variant="ghost"
              >
                <RotateCcw aria-hidden="true" />
                Clear
              </Button>
            ) : null}
            {showPrintButton ? (
              <Button
                className={printButtonClasses}
                onClick={() => window.print()}
                size="xs"
                type="button"
                variant="outline"
              >
                <Printer aria-hidden="true" />
                Print
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <ol
        className={cn(
          grid.container,
          grid.usesTwo && '@xl:gap-x-12',
          grid.usesThree && '@3xl:gap-x-10',
        )}
        data-document-checklist-columns={grid.usesThree ? 'three' : grid.usesTwo ? 'two' : 'one'}
        data-document-checklist-presentation="ledger"
        style={grid.style}
      >
        {items.map((item, index) => {
          const isChecked = checkedSet.has(item.key)
          const inputId = `${baseId}-${index}`
          // Narrow three-column cells tuck the condition under the label instead of beside it.
          const qualifierBeside = !grid.usesThree
          const rowClasses = cn(
            'grid h-full items-baseline gap-x-4 py-4',
            enableTracking
              ? showMarker
                ? 'grid-cols-[1.125rem_2.25rem_minmax(0,1fr)]'
                : 'grid-cols-[1.125rem_minmax(0,1fr)]'
              : showMarker
                ? 'grid-cols-[2.25rem_minmax(0,1fr)]'
                : 'grid-cols-[minmax(0,1fr)]',
            qualifierBeside &&
              (enableTracking
                ? showMarker
                  ? 'sm:grid-cols-[1.125rem_2.25rem_minmax(0,1fr)_auto]'
                  : 'sm:grid-cols-[1.125rem_minmax(0,1fr)_auto]'
                : showMarker
                  ? 'sm:grid-cols-[2.25rem_minmax(0,1fr)_auto]'
                  : 'sm:grid-cols-[minmax(0,1fr)_auto]'),
          )
          const qualifier = item.qualifier ? (
            <span
              className={cn(
                'font-[family-name:var(--font-display)] text-sm whitespace-nowrap italic',
                ledgerAccent,
              )}
            >
              {item.qualifier}
            </span>
          ) : null
          const content = (
            <>
              {showMarker ? (
                markerStyle === 'check' ? (
                  <Check aria-hidden="true" className={cn('size-4 self-center', ledgerAccent)} />
                ) : (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-right font-[family-name:var(--font-display)] text-xl leading-none italic opacity-60',
                      ledgerAccent,
                    )}
                  >
                    {formatChecklistMarker(index, markerStyle).replace(/\.$/, '')}
                  </span>
                )
              ) : null}
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={cn(
                    'font-sans text-base leading-relaxed transition-colors motion-reduce:transition-none',
                    isChecked && 'text-current/50 line-through decoration-current/40',
                  )}
                >
                  {item.label}
                </span>
                {item.details ? (
                  <span className="text-sm leading-6 text-current/65">{item.details}</span>
                ) : null}
                {qualifierBeside ? <span className="sm:hidden">{qualifier}</span> : qualifier}
              </span>
              {qualifierBeside && qualifier ? (
                <span className="hidden sm:block">{qualifier}</span>
              ) : null}
            </>
          )

          return (
            <li
              key={item.key}
              className={cn('min-w-0 border-current/15', grid.ledgerItem(index))}
              data-checked={isChecked || undefined}
            >
              {enableTracking ? (
                <label className={cn(rowClasses, 'cursor-pointer')} htmlFor={inputId}>
                  <Checkbox
                    checked={isChecked}
                    className={cn(
                      'size-4.5 translate-y-0.5 self-start border-current/40 bg-transparent',
                      // On brand surfaces a primary fill would vanish, so ticks invert to the foreground.
                      isBrandSurface
                        ? 'data-checked:border-primary-foreground data-checked:bg-primary-foreground data-checked:text-primary'
                        : 'data-checked:border-primary',
                    )}
                    id={inputId}
                    onCheckedChange={(value) => toggleItem(item.key, value === true)}
                  />
                  {content}
                </label>
              ) : (
                <div className={rowClasses}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )

  const list = isLedger ? ledgerList : trackerList

  const ledgerNotes =
    isLedger && !hasSidebar && notes.length > 0 ? (
      <div
        className="flex min-w-0 flex-col gap-3 text-current"
        data-document-checklist-notes="true"
      >
        {notes.map((note) => (
          <p
            key={note.key}
            className="grid max-w-3xl grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 text-sm leading-7 text-current/75"
            data-document-checklist-note="true"
          >
            <span
              aria-hidden="true"
              className={cn(
                'text-right font-[family-name:var(--font-display)] text-xl leading-7 italic',
                ledgerAccent,
              )}
            >
              *
            </span>
            <span>
              {note.label ? (
                <strong className="font-semibold text-current">{note.label}. </strong>
              ) : null}
              {note.text}
            </span>
          </p>
        ))}
      </div>
    ) : null

  const looseNotes =
    ledgerNotes ??
    (!hasSidebar && notes.length > 0 ? (
      <div
        className="@container flex min-w-0 flex-col divide-y divide-border rounded-card border border-border bg-muted/40 text-card-foreground"
        data-document-checklist-notes="true"
      >
        {notes.map((note) => (
          <div
            key={note.key}
            className={cn(
              'grid gap-1.5 px-5 py-4 sm:px-6',
              // Once the box is wide enough, the label takes a narrow column and the text runs
              // beside it, so a full-width box isn't half empty.
              note.label && '@2xl:grid-cols-[auto_minmax(0,1fr)] @2xl:gap-x-6',
            )}
            data-document-checklist-note="true"
          >
            {note.label ? (
              // The label column fits the label, so short labels sit beside the text; long ones wrap.
              <p
                className={cn(sidebarLabelClasses, 'leading-6 text-muted-foreground @2xl:max-w-56')}
              >
                {note.label}
              </p>
            ) : null}
            <p className="max-w-4xl text-sm leading-6">{note.text}</p>
          </div>
        ))}
      </div>
    ) : null)

  // In Split, bottom content lives in the introduction column on large screens and follows the
  // checklist on small screens, where the columns stack.
  const checklistBottom = bottomContent ? (
    <div className={cn(isSplit && 'lg:hidden')}>{bottomContent}</div>
  ) : null

  const checklist =
    looseNotes || checklistBottom ? (
      <div className={cn('flex min-w-0 flex-col', isLedger ? 'gap-8' : 'gap-4')}>
        {list}
        {looseNotes}
        {checklistBottom}
      </div>
    ) : (
      list
    )

  const sidebar = hasSidebar ? (
    <aside
      className={cn(
        'flex min-w-0 flex-col gap-5 rounded-card p-6 sm:p-7',
        surface.className,
        surface.value === 'default' && 'border border-border',
      )}
      data-card-background={surface.value}
      data-document-checklist-sidebar="true"
    >
      {enableTracking ? (
        <div className="flex flex-col gap-3">
          <p className={sidebarLabelClasses}>{progressLabel}</p>
          <p aria-live="polite" className="flex items-baseline gap-2">
            <span className="font-sans text-4xl leading-none font-semibold tabular-nums">
              {readyCount}
            </span>
            <span className="text-base text-current/80">of {items.length} ready</span>
          </p>
          <div
            aria-label={`${readyCount} of ${items.length} documents ready`}
            aria-valuemax={items.length}
            aria-valuemin={0}
            aria-valuenow={readyCount}
            className="h-1.5 overflow-hidden rounded-full bg-current/20"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm leading-6 text-current/80">
            Ticks are saved on this device only. Nothing is uploaded.
          </p>
        </div>
      ) : null}

      {showPrintButton || showClear ? (
        <div className="flex flex-wrap gap-2 print:hidden">
          {showPrintButton ? (
            <Button
              className={printButtonClasses}
              onClick={() => window.print()}
              size="sm"
              type="button"
              variant="outline"
            >
              <Printer aria-hidden="true" />
              Print checklist
            </Button>
          ) : null}
          {showClear ? (
            <Button
              className={clearButtonClasses}
              onClick={() => updateCheckedKeys([])}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" />
              Clear ticks
            </Button>
          ) : null}
        </div>
      ) : null}

      {notes.length > 0 ? (
        <div
          className={cn('flex flex-col divide-y border-t', surface.divider, '[&>*]:border-inherit')}
        >
          {notes.map((note) => (
            <div
              key={note.key}
              className="flex flex-col gap-2 pt-4 [&:not(:last-child)]:pb-4"
              data-document-checklist-note="true"
            >
              {note.label ? <p className={sidebarLabelClasses}>{note.label}</p> : null}
              <p className="text-sm leading-6 text-current/90">{note.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  ) : null

  if (isSplit && bottomContent) {
    // The column stretches to the checklist's height so its last item can sit at the bottom. The
    // header keeps its own alignment area above it, so a sticky header never slides over the link.
    return (
      <div
        className={cn(
          'grid min-w-0 grid-cols-1 items-start gap-10 lg:gap-12',
          splitGridClasses(layout),
        )}
        data-document-checklist-layout="split"
      >
        <div
          className={cn(
            'flex min-w-0 flex-col gap-8 lg:self-stretch',
            layout.checklistPosition === 'left' && 'lg:col-start-2 lg:row-start-1',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col',
              layout.verticalAlignment === 'center' && 'lg:justify-center',
              layout.verticalAlignment === 'bottom' && 'lg:justify-end',
            )}
          >
            <div
              className={cn(
                'flex min-w-0 flex-col gap-8',
                layout.verticalAlignment === 'top' && 'lg:sticky lg:top-24',
              )}
            >
              {header}
              {sidebar}
            </div>
          </div>
          <div className="hidden lg:block" data-document-checklist-intro-bottom="true">
            {bottomContent}
          </div>
        </div>
        {checklist}
      </div>
    )
  }

  if (isSplit) {
    return (
      <div
        className={cn(
          'grid min-w-0 grid-cols-1 items-start gap-10 lg:gap-12',
          splitGridClasses(layout),
        )}
        data-document-checklist-layout="split"
      >
        <div
          className={cn(
            'flex min-w-0 flex-col gap-8',
            verticalAlignmentClasses[layout.verticalAlignment],
            layout.checklistPosition === 'left' && 'lg:col-start-2 lg:row-start-1',
          )}
        >
          {header}
          {sidebar}
        </div>
        {checklist}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-10" data-document-checklist-layout="stacked">
      {header}
      <div
        className={cn(
          'grid min-w-0 items-start gap-6 lg:gap-8',
          hasSidebar && 'lg:grid-cols-[minmax(0,1fr)_20rem]',
        )}
      >
        {checklist}
        {sidebar ? <div className="min-w-0 lg:sticky lg:top-24">{sidebar}</div> : null}
      </div>
    </div>
  )
}

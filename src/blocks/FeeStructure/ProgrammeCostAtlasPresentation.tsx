import { FeeStructureDownload } from './FeeStructureDownload'
import { isNumericFeeValue } from './normalizeFeeStructure'
import type {
  ResolvedFeeStructureCategory,
  ResolvedFeeStructureDownload,
  ResolvedFeeStructureProgrammeDetail,
  ResolvedFeeStructureRow,
} from './types'
import { cn } from '@/lib/utils'

const desktopPeriodGridClasses = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
} as const

type PeriodBreakdownDensity = 'compact' | 'default'

function PeriodBreakdown({
  category,
  density = 'default',
  row,
}: {
  category: ResolvedFeeStructureCategory
  density?: PeriodBreakdownDensity
  row: ResolvedFeeStructureRow
}) {
  const desktopColumns =
    desktopPeriodGridClasses[
      Math.min(Math.max(category.columns.length, 1), 6) as keyof typeof desktopPeriodGridClasses
    ]

  return (
    <dl
      className={cn('grid grid-cols-2', desktopColumns)}
      data-fee-atlas-period-density={density}
      data-fee-atlas-period-grid="true"
    >
      {category.columns.map((column, index) => {
        const value = row.cells[index] ?? '—'
        const isLastOddItem =
          category.columns.length % 2 === 1 && index === category.columns.length - 1
        const showsCompactRowDivider = isLastOddItem && category.columns.length > 1

        return (
          <div
            className={cn(
              'min-w-0 px-3',
              density === 'compact' ? 'py-3' : 'py-4',
              index % 2 === 1 && 'border-l border-current/15',
              index >= 2 && 'border-t border-current/15',
              index > 0 && 'lg:border-l lg:border-current/15',
              'lg:border-t-0',
              isLastOddItem && 'col-span-2 lg:col-span-1',
              showsCompactRowDivider &&
                "relative after:absolute after:inset-y-0 after:left-1/2 after:border-l after:border-current/15 after:content-[''] lg:after:hidden",
            )}
            data-fee-atlas-compact-divider={showsCompactRowDivider ? 'true' : undefined}
            data-fee-atlas-period="true"
            key={`${row.id}-${column.id}`}
          >
            <dt className="text-left font-mono text-xs font-medium uppercase tracking-[0.14em] text-current/65">
              {column.label}
            </dt>
            <dd
              className={cn(
                'mt-2 wrap-break-word text-left text-sm font-medium text-current',
                isNumericFeeValue(value) && 'tabular-nums',
              )}
              data-fee-value="true"
            >
              {value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

type ProgrammeCostAtlasPresentationProps = {
  academicSession: string
  category: ResolvedFeeStructureCategory
  download?: ResolvedFeeStructureDownload
  programmeDetails: ResolvedFeeStructureProgrammeDetail[]
  programmeName: string
}

export function ProgrammeCostAtlasPresentation({
  academicSession,
  category,
  download,
  programmeDetails,
  programmeName,
}: ProgrammeCostAtlasPresentationProps) {
  const annualTotalIndex = category.rows.findIndex((row) => row.emphasis === 'total')
  const annualTotals = annualTotalIndex >= 0 ? category.rows[annualTotalIndex] : undefined
  const statementRows = category.rows.filter((_, index) => index !== annualTotalIndex)
  const details = [
    { id: 'programme', label: 'Programme', value: programmeName },
    { id: 'session', label: 'Academic Session', value: academicSession },
    { id: 'category', label: 'Admission Category', value: category.label },
    ...programmeDetails,
  ]

  return (
    <div
      className="grid min-w-0 overflow-clip rounded-card border border-border lg:grid-cols-2"
      data-fee-atlas="true"
      data-fee-category={category.label}
    >
      <aside className="min-w-0 bg-primary text-primary-foreground" data-fee-atlas-summary="true">
        <div
          className="flex min-h-full flex-col gap-8 p-6 sm:p-8 lg:sticky lg:top-24 lg:min-h-[min(42rem,calc(100vh-8rem))]"
          data-fee-atlas-summary-inner="true"
        >
          <section data-fee-atlas-programme-details="true">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {details.map((detail) => (
                <div className="min-w-0" key={detail.id}>
                  <dt className="font-mono text-xs uppercase tracking-[0.08em] text-primary-foreground">
                    {detail.label}
                  </dt>
                  <dd
                    className={cn(
                      'mt-1 wrap-break-word text-base font-medium',
                      isNumericFeeValue(detail.value) && 'tabular-nums',
                    )}
                  >
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {annualTotals ? (
            <section data-fee-atlas-annual-totals="true">
              <h3
                className="font-sans text-xl font-semibold tracking-tight"
                data-fee-atlas-title="true"
              >
                Annual totals
              </h3>
              {annualTotals.note ? (
                <p className="mt-1 text-sm leading-6 text-primary-foreground">
                  {annualTotals.note}
                </p>
              ) : null}
              <div className="mt-4 border-y border-primary-foreground/20">
                <PeriodBreakdown category={category} row={annualTotals} />
              </div>
            </section>
          ) : null}

          {category.completeProgrammeExpense || download ? (
            <div className="flex flex-col gap-5 flex-1">
              {category.completeProgrammeExpense ? (
                <section data-fee-atlas-complete-expense="true">
                  <h3 className="text-sm font-sans font-medium text-primary-foreground">
                    {category.completeProgrammeExpenseLabel}
                  </h3>
                  <p
                    className={cn(
                      'mt-2 wrap-break-word text-left font-sans text-2xl font-semibold tracking-tight text-primary-foreground',
                      isNumericFeeValue(category.completeProgrammeExpense) && 'tabular-nums',
                    )}
                    data-fee-atlas-complete-expense-value="true"
                    data-fee-atlas-title="true"
                  >
                    {category.completeProgrammeExpense}
                  </p>
                  {category.completeProgrammeExpenseNote ? (
                    <p className="mt-1 text-xs leading-6 text-primary-foreground">
                      {category.completeProgrammeExpenseNote}
                    </p>
                  ) : null}
                </section>
              ) : null}

              <div className="flex flex-col flex-1 gap-5 justify-end">
                {download ? (
                  <FeeStructureDownload download={{ ...download, sectionBackground: 'brand' }} />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 bg-card text-card-foreground" data-fee-atlas-statement="true">
        <div className="border-b border-border p-6 sm:p-8" data-fee-atlas-statement-header="true">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Statement breakdown
          </p>
          <h3
            className="mt-3 font-sans text-lg font-semibold tracking-tight text-card-foreground"
            data-fee-atlas-title="true"
          >
            {category.label}
          </h3>
          {category.caption ? (
            <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
              {category.caption}
            </p>
          ) : null}
        </div>

        <div className="divide-y divide-border">
          {statementRows.map((row) => (
            <article
              className="px-6 py-5 transition-colors hover:bg-accent/35 sm:px-8 sm:py-5"
              data-fee-atlas-fee-chapter="true"
              data-fee-row-emphasis={row.emphasis}
              key={row.id}
            >
              <div className="mb-3" data-fee-atlas-fee-chapter-heading="true">
                <h4
                  className={cn(
                    'font-sans text-sm leading-tight tracking-tight text-card-foreground sm:text-sm',
                    row.emphasis === 'total' ? 'font-bold' : 'font-medium',
                  )}
                  data-fee-atlas-title="true"
                  data-fee-row-label="true"
                >
                  {row.label}
                </h4>
                {row.note ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{row.note}</p>
                ) : null}
              </div>
              <PeriodBreakdown category={category} density="compact" row={row} />
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

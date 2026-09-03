import { useId } from 'react'

import {
  FeeDocumentDownload,
  type ResolvedFeeDocumentDownload,
} from '@/blocks/shared/FeeDocumentDownload'
import { cn } from '@/lib/utils'

import { isNumericPGFeeValue } from './normalizePGFeeStructure'
import type { ResolvedPGFeeCategory } from './types'

type PGFeeStructureAtlasPresentationProps = {
  academicSession: string
  category: ResolvedPGFeeCategory
  download?: ResolvedFeeDocumentDownload
  programmeName: string
}

export function PGFeeStructureAtlasPresentation({
  academicSession,
  category,
  download,
  programmeName,
}: PGFeeStructureAtlasPresentationProps) {
  const chapterIDPrefix = useId()
  const departmentCount = category.departments.length
  const hasBoundedDepartmentList = departmentCount > 4
  const sharedCharges = category.columns.filter(({ valueMode }) => valueMode === 'shared')
  const summaryFacts = [
    { id: 'programme', label: 'Programme', value: programmeName },
    { id: 'session', label: 'Academic Session', value: academicSession },
    { id: 'category', label: 'Admission Category', value: category.label },
    {
      id: 'departments',
      label: 'Departments',
      value: `${departmentCount} ${departmentCount === 1 ? 'Department' : 'Departments'}`,
    },
  ]

  return (
    <div
      className={cn(
        'grid h-auto max-h-none min-w-0 overflow-clip rounded-card border border-border lg:grid-cols-2',
        hasBoundedDepartmentList && 'lg:h-[676px]',
      )}
      data-pg-fee-atlas="true"
      data-pg-fee-category={category.label}
    >
      <aside
        className={cn(
          'h-auto max-h-none min-w-0 bg-primary text-primary-foreground',
          hasBoundedDepartmentList && 'lg:h-full lg:min-h-0 lg:overflow-y-auto',
        )}
        data-pg-fee-atlas-summary="true"
      >
        <div
          className={cn(
            'flex min-h-full flex-col gap-8 p-6 sm:p-8',
            hasBoundedDepartmentList
              ? 'lg:h-full lg:min-h-0'
              : 'lg:sticky lg:top-24 lg:min-h-[min(42rem,calc(100vh-8rem))]',
          )}
          data-pg-fee-atlas-summary-inner="true"
        >
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2" data-pg-fee-summary-facts="true">
            {summaryFacts.map((fact) => (
              <div className="min-w-0" key={fact.id}>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground">
                  {fact.label}
                </dt>
                <dd className="mt-1 wrap-break-word font-sans text-base font-medium">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {sharedCharges.length > 0 ? (
            <section data-pg-fee-shared-charges="true">
              <h3 className="font-sans text-xl font-semibold tracking-tight">Shared charges</h3>
              <dl className="mt-4 divide-y divide-primary-foreground/20 border-y border-primary-foreground/20">
                {sharedCharges.map((charge) => {
                  const value = charge.sharedValue ?? '—'

                  return (
                    <div
                      className="grid min-w-0 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5"
                      key={charge.id}
                    >
                      <dt className="wrap-break-word text-sm text-primary-foreground">
                        {charge.label}
                      </dt>
                      <dd
                        className={cn(
                          'wrap-break-word text-sm font-semibold',
                          isNumericPGFeeValue(value) && 'tabular-nums',
                        )}
                      >
                        {value}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ) : null}

          {category.notes.length > 0 ? (
            <section data-pg-fee-category-notes="true">
              <h3 className="font-sans text-sm font-semibold">Notes</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-primary-foreground">
                {category.notes.map((note) => (
                  <li className={cn(note.emphasis && 'font-semibold')} key={note.id}>
                    {note.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {download ? (
            <div className="mt-auto pt-2">
              <FeeDocumentDownload download={{ ...download, sectionBackground: 'brand' }} />
            </div>
          ) : null}
        </div>
      </aside>

      <section
        className={cn(
          'h-auto max-h-none min-w-0 bg-card text-card-foreground',
          hasBoundedDepartmentList && 'lg:flex lg:h-full lg:min-h-0 lg:flex-col',
        )}
        data-pg-fee-atlas-statement="true"
      >
        <header className="shrink-0 border-b border-border p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Statement breakdown
          </p>
          <h3 className="mt-3 font-sans text-lg font-semibold tracking-tight text-card-foreground">
            {category.label}
          </h3>
          {category.caption ? (
            <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
              {category.caption}
            </p>
          ) : null}
        </header>

        <div
          aria-label={
            hasBoundedDepartmentList ? `${category.label} department fee statements` : undefined
          }
          className={cn(
            'h-auto max-h-none divide-y divide-border',
            hasBoundedDepartmentList &&
              'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:outline-none lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]',
          )}
          data-pg-fee-department-scroll={hasBoundedDepartmentList ? 'true' : undefined}
          role={hasBoundedDepartmentList ? 'region' : undefined}
          tabIndex={hasBoundedDepartmentList ? 0 : undefined}
        >
          {category.departments.map((department) => {
            const headingID = `${chapterIDPrefix}-${department.id}`

            return (
              <article
                aria-labelledby={headingID}
                className="px-6 py-5 transition-colors hover:bg-accent/35 sm:px-8 motion-reduce:transition-none"
                data-pg-fee-department-chapter="true"
                key={department.id}
              >
                <div className="mb-4">
                  <h4
                    className="font-sans text-sm leading-tight tracking-tight text-card-foreground sm:text-sm font-medium"
                    id={headingID}
                  >
                    {department.name}
                  </h4>
                  {department.note ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {department.note}
                    </p>
                  ) : null}
                </div>
                <dl
                  className="grid grid-cols-2 lg:gap-x-5 lg:gap-y-4 lg:[grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]"
                  data-pg-fee-grid="true"
                >
                  {category.columns.map((column, index) => {
                    const value = department.cells[index] ?? '—'
                    const isLastOddItem =
                      category.columns.length % 2 === 1 && index === category.columns.length - 1
                    const showsCompactCenterDivider = isLastOddItem && category.columns.length > 1

                    return (
                      <div
                        className={cn(
                          'relative min-w-0 px-3 py-3 lg:px-0 lg:py-0',
                          index % 2 === 1 && 'border-l border-border',
                          index >= 2 && 'border-t border-border',
                          index > 0 && 'lg:border-l lg:border-border lg:pl-4',
                          'lg:border-t-0',
                          isLastOddItem && 'col-span-2 lg:col-span-1',
                          showsCompactCenterDivider &&
                            "after:absolute after:inset-y-0 after:left-1/2 after:border-l after:border-border after:content-[''] lg:after:hidden",
                        )}
                        data-pg-fee-compact-divider={showsCompactCenterDivider ? 'true' : undefined}
                        key={column.id}
                      >
                        <dt className="wrap-break-word font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {column.label}
                        </dt>
                        <dd
                          className={cn(
                            'mt-2 wrap-break-word text-sm font-medium',
                            isNumericPGFeeValue(value) && 'tabular-nums',
                          )}
                          data-pg-fee-value="true"
                        >
                          {value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

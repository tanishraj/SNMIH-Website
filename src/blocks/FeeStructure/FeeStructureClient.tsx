'use client'

import { useState } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import {
  getContentTabClasses,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { isNumericFeeValue } from './normalizeFeeStructure'
import { ProgrammeCostAtlasPresentation } from './ProgrammeCostAtlasPresentation'
import type {
  FeeStructureLayout,
  FeeStructureTabStyle,
  FeeStructureTabWidth,
  ResolvedFeeStructureCategory,
  ResolvedFeeStructureDownload,
  ResolvedFeeStructureProgrammeDetail,
} from './types'

export const resolveFeeStructureTabVariant = (
  value?: FeeStructureTabStyle | null,
): ContentTabVariant => {
  if (value === 'pills') return 'pill'
  if (value === 'boxed') return 'contained'
  return 'underline'
}

const feeTabRailWidthClasses = {
  centered: 'mx-auto w-max',
  content: 'w-max min-w-full',
  equal: 'w-full min-w-0',
} as const satisfies Record<FeeStructureTabWidth, string>

const feeTabFrameWidthClasses = {
  centered: 'mx-auto w-fit max-w-full',
  content: 'w-full',
  equal: 'w-full',
} as const satisfies Record<FeeStructureTabWidth, string>

const feeRowSurfaceClasses = {
  light: {
    standard: '[&>*]:bg-card hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_40%)]',
    total:
      '[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_55%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_75%)]',
  },
  brand: {
    standard:
      '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_6%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_12%)]',
    total:
      '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_10%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_18%)]',
  },
} as const

function FeeCategoryPresentation({
  category,
  sectionBackground,
}: {
  category: ResolvedFeeStructureCategory
  sectionBackground?: BlockBackground | null
}) {
  const isBrandSurface = resolveBlockSurface(sectionBackground) === 'brand'
  const tableSurface = isBrandSurface ? 'brand' : 'light'

  return (
    <div className="flex flex-col gap-6" data-fee-category={category.label}>
      <div
        className="hidden overflow-x-auto pb-2 md:block"
        data-fee-structure-desktop="true"
        data-fee-table-scroll="true"
      >
        <div
          className={cn(
            'min-w-max overflow-hidden rounded-card border',
            isBrandSurface
              ? 'border-primary-foreground/20 bg-primary-foreground/[0.06] text-primary-foreground'
              : 'border-border bg-card text-card-foreground',
          )}
          data-fee-surface={isBrandSurface ? 'brand' : 'light'}
        >
          <Table>
            {category.caption ? (
              <TableCaption
                className={isBrandSurface ? 'text-primary-foreground' : 'text-muted-foreground'}
              >
                {category.caption}
              </TableCaption>
            ) : null}
            <TableHeader
              className={cn(
                isBrandSurface &&
                  'bg-primary-foreground/[0.08] [&_tr]:border-primary-foreground/20',
              )}
              data-fee-table-header="true"
            >
              <TableRow
                className={cn(
                  isBrandSurface
                    ? 'bg-primary-foreground/[0.08] hover:bg-primary-foreground/[0.08]'
                    : 'hover:bg-transparent',
                )}
                data-fee-table-header-row="true"
              >
                <TableHead
                  className={cn(
                    'sticky left-0 z-20 min-w-56 text-left text-current',
                    isBrandSurface ? 'bg-primary text-primary-foreground' : 'bg-card',
                  )}
                  data-fee-sticky-head="true"
                >
                  Fee Head
                </TableHead>
                {category.columns.map((column) => (
                  <TableHead className="min-w-36 text-right text-current" key={column.id}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.rows.map((row) => (
                <TableRow
                  className={cn(
                    'hover:bg-transparent',
                    isBrandSurface && 'border-primary-foreground/20',
                    feeRowSurfaceClasses[tableSurface][row.emphasis],
                    row.emphasis === 'total' && 'font-bold',
                  )}
                  data-fee-row-emphasis={row.emphasis}
                  key={row.id}
                >
                  <TableHead
                    className={cn(
                      'sticky left-0 z-10 h-auto py-3 text-left whitespace-normal',
                      row.emphasis === 'total' ? 'font-bold' : 'font-normal',
                      isBrandSurface ? 'text-primary-foreground' : 'text-card-foreground',
                    )}
                    data-fee-row-label="true"
                    data-fee-sticky-head="true"
                    scope="row"
                  >
                    <span className="block">{row.label}</span>
                    {row.note ? (
                      <span
                        className={cn(
                          'mt-1 block text-xs font-normal',
                          isBrandSurface ? 'text-primary-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {row.note}
                      </span>
                    ) : null}
                  </TableHead>
                  {row.cells.map((value, index) => (
                    <TableCell
                      className={cn('text-right', isNumericFeeValue(value) && 'tabular-nums')}
                      data-fee-value="true"
                      key={`${row.id}-${category.columns[index]?.id ?? index}`}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden" data-fee-structure-mobile="true">
        {category.columns.map((column, columnIndex) => (
          <Card
            className={cn(
              'gap-0 rounded-card border py-0 shadow-none ring-0',
              isBrandSurface
                ? 'border-primary-foreground/20 bg-primary-foreground/[0.06] text-primary-foreground'
                : 'border-border bg-card text-card-foreground',
            )}
            data-fee-period-card="true"
            data-fee-surface={isBrandSurface ? 'brand' : 'light'}
            key={column.id}
          >
            <CardHeader
              className={cn(
                'rounded-none border-b px-5 py-4',
                isBrandSurface
                  ? 'border-primary-foreground/20 bg-primary-foreground/[0.08]'
                  : 'border-border',
              )}
            >
              <CardTitle>
                <h3 className="font-sans text-lg font-semibold">{column.label}</h3>
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn(
                'px-5',
                isBrandSurface ? 'divide-y divide-primary-foreground/20' : 'divide-y divide-border',
              )}
            >
              {category.rows.map((row) => {
                const value = row.cells[columnIndex] ?? '—'

                return (
                  <div
                    className={cn(
                      'grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4',
                      row.emphasis === 'total' &&
                        (isBrandSurface
                          ? '-mx-5 bg-primary-foreground/[0.1] px-5 font-bold'
                          : '-mx-5 bg-muted/60 px-5 font-bold'),
                    )}
                    data-fee-row-emphasis={row.emphasis}
                    key={row.id}
                  >
                    <div>
                      <p
                        className={row.emphasis === 'total' ? 'font-bold' : 'font-medium'}
                        data-fee-row-label="true"
                      >
                        {row.label}
                      </p>
                      {row.note ? (
                        <p
                          className={cn(
                            'mt-1 text-xs font-normal',
                            isBrandSurface ? 'text-primary-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {row.note}
                        </p>
                      ) : null}
                    </div>
                    <p
                      className={cn('text-right', isNumericFeeValue(value) && 'tabular-nums')}
                      data-fee-value="true"
                    >
                      {value}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {category.notes.length > 0 ? (
        <ul
          className={cn(
            'flex flex-col gap-2 text-sm leading-6',
            isBrandSurface ? 'text-primary-foreground' : 'text-muted-foreground',
          )}
          data-fee-category-notes="true"
        >
          {category.notes.map((note) => (
            <li className={cn(note.emphasis && 'font-semibold text-current')} key={note.id}>
              {note.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function FeeStructureClient({
  academicSession,
  categories,
  download,
  layout,
  programmeDetails,
  programmeName,
  sectionBackground,
  tabStyle,
  tabWidth,
}: {
  academicSession: string
  categories: ResolvedFeeStructureCategory[]
  download?: ResolvedFeeStructureDownload
  layout?: FeeStructureLayout | null
  programmeDetails: ResolvedFeeStructureProgrammeDetail[]
  programmeName: string
  sectionBackground?: BlockBackground | null
  tabStyle?: FeeStructureTabStyle | null
  tabWidth?: FeeStructureTabWidth | null
}) {
  const resolvedLayout: FeeStructureLayout =
    layout === 'programmeCostAtlas' ? 'programmeCostAtlas' : 'table'
  const storedStyle = tabStyle === 'boxed' || tabStyle === 'pills' ? tabStyle : 'underline'
  const variant = resolveFeeStructureTabVariant(storedStyle)
  const tabSurface = resolveBlockSurface(sectionBackground)
  const resolvedTabWidth: FeeStructureTabWidth =
    tabWidth === 'centered' || tabWidth === 'equal' ? tabWidth : 'content'
  const [selectedCategoryID, setSelectedCategoryID] = useState(categories[0]?.id ?? '')

  const renderCategory = (category: ResolvedFeeStructureCategory) =>
    resolvedLayout === 'programmeCostAtlas' ? (
      <ProgrammeCostAtlasPresentation
        academicSession={academicSession}
        category={category}
        download={download}
        programmeDetails={programmeDetails}
        programmeName={programmeName}
      />
    ) : (
      <FeeCategoryPresentation category={category} sectionBackground={sectionBackground} />
    )

  if (categories.length === 0) return null

  if (categories.length === 1) {
    const category = categories[0]!

    return (
      <div className="flex flex-col gap-4" data-fee-categories="true">
        {resolvedLayout === 'table' ? (
          <h3 className="font-sans text-xl font-semibold text-current">{category.label}</h3>
        ) : null}
        {renderCategory(category)}
      </div>
    )
  }

  const activeCategoryID = categories.some(({ id }) => id === selectedCategoryID)
    ? selectedCategoryID
    : categories[0]!.id

  return (
    <TabsPrimitive.Root
      className="flex flex-col gap-6"
      data-fee-categories="true"
      data-fee-tab-style={storedStyle}
      onValueChange={setSelectedCategoryID}
      value={activeCategoryID}
    >
      <div className="pb-1">
        <ScrollableContentTabRail
          className={feeTabFrameWidthClasses[resolvedTabWidth]}
          surface={tabSurface}
          variant={variant}
        >
          <TabsPrimitive.List
            aria-label="Fee categories"
            className={cn('flex flex-nowrap', feeTabRailWidthClasses[resolvedTabWidth])}
            data-content-tab-variant={variant}
            data-fee-tab-width={resolvedTabWidth}
          >
            {categories.map((category) => (
              <TabsPrimitive.Trigger
                className={cn(
                  getContentTabClasses(variant, category.id === activeCategoryID, tabSurface),
                  resolvedTabWidth === 'equal' &&
                    'w-0 min-w-0 flex-1 shrink overflow-hidden px-2 text-ellipsis',
                )}
                key={category.id}
                value={category.id}
              >
                {category.label}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </ScrollableContentTabRail>
      </div>
      {categories.map((category) => (
        <TabsPrimitive.Content className="mt-0 outline-none" key={category.id} value={category.id}>
          {renderCategory(category)}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

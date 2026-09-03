'use client'

import { useState } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
import {
  getContentTabClasses,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import type { ResolvedFeeDocumentDownload } from '@/blocks/shared/FeeDocumentDownload'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { cn } from '@/lib/utils'

import { PGFeeStructureAtlasPresentation } from './PGFeeStructureAtlasPresentation'
import type {
  PGFeeTabStyle,
  PGFeeTabWidth,
  ResolvedPGFeeCategory,
} from './types'

export const resolvePGFeeTabVariant = (
  value?: PGFeeTabStyle | null,
): ContentTabVariant => {
  if (value === 'pills') return 'pill'
  if (value === 'boxed') return 'contained'
  return 'underline'
}

const pgFeeTabRailWidthClasses = {
  centered: 'mx-auto w-max',
  content: 'w-max min-w-full',
  equal: 'w-full min-w-0',
} as const satisfies Record<PGFeeTabWidth, string>

const pgFeeTabFrameWidthClasses = {
  centered: 'mx-auto w-fit max-w-full',
  content: 'w-full',
  equal: 'w-full',
} as const satisfies Record<PGFeeTabWidth, string>

type PGFeeStructureClientProps = {
  academicSession: string
  categories: ResolvedPGFeeCategory[]
  download?: ResolvedFeeDocumentDownload
  programmeName: string
  sectionBackground?: BlockBackground | null
  tabStyle?: PGFeeTabStyle | null
  tabWidth?: PGFeeTabWidth | null
}

export function PGFeeStructureClient({
  academicSession,
  categories,
  download,
  programmeName,
  sectionBackground,
  tabStyle,
  tabWidth,
}: PGFeeStructureClientProps) {
  const storedStyle = tabStyle === 'boxed' || tabStyle === 'pills' ? tabStyle : 'underline'
  const variant = resolvePGFeeTabVariant(storedStyle)
  const tabSurface = resolveBlockSurface(sectionBackground)
  const resolvedTabWidth: PGFeeTabWidth =
    tabWidth === 'centered' || tabWidth === 'equal' ? tabWidth : 'content'
  const [selectedCategoryID, setSelectedCategoryID] = useState(categories[0]?.id ?? '')

  if (categories.length === 0) return null

  if (categories.length === 1) {
    return (
      <div data-pg-fee-categories="true">
        <PGFeeStructureAtlasPresentation
          academicSession={academicSession}
          category={categories[0]!}
          download={download}
          programmeName={programmeName}
        />
      </div>
    )
  }

  const activeCategoryID = categories.some(({ id }) => id === selectedCategoryID)
    ? selectedCategoryID
    : categories[0]!.id

  return (
    <TabsPrimitive.Root
      className="flex flex-col gap-6"
      data-pg-fee-categories="true"
      data-pg-fee-tab-style={storedStyle}
      onValueChange={setSelectedCategoryID}
      value={activeCategoryID}
    >
      <div className="pb-1">
        <ScrollableContentTabRail
          className={pgFeeTabFrameWidthClasses[resolvedTabWidth]}
          surface={tabSurface}
          variant={variant}
        >
          <TabsPrimitive.List
            aria-label="PG fee categories"
            className={cn('flex flex-nowrap', pgFeeTabRailWidthClasses[resolvedTabWidth])}
            data-content-tab-variant={variant}
            data-pg-fee-tab-width={resolvedTabWidth}
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
          <PGFeeStructureAtlasPresentation
            academicSession={academicSession}
            category={category}
            download={download}
            programmeName={programmeName}
          />
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

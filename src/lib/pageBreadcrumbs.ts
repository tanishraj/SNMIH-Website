import { getPageHref, isPageDoc } from '@/lib/pagePaths'
import type { Page, PageHeaderBlock } from '@/payload-types'

export type ResolvedPageBreadcrumb = {
  label: string
  url?: string
}

type BreadcrumbMode = 'automatic' | 'custom' | 'hidden'
export type ManualBreadcrumbInput = {
  label?: string | null
  linkType?: 'custom' | 'page' | null
  page?: Page | string | number | null
  url?: string | null
}
type PageHeaderBreadcrumbSource = Pick<PageHeaderBlock, 'breadcrumbs'> & {
  breadcrumbMode?: BreadcrumbMode | null
}

type ReusableSectionSource = {
  layout?: Page['layout'] | null
}

const MAX_PAGE_ANCESTORS = 32
const MAX_REUSABLE_SECTION_DEPTH = 10

export function resolveAutomaticPageBreadcrumbs(
  page: Page,
  { isHomepage = false }: { isHomepage?: boolean } = {},
): ResolvedPageBreadcrumb[] {
  if (isHomepage) return []

  const chain: Page[] = []
  const visited = new Set<string>()
  let current: Page | null = page

  while (current && chain.length < MAX_PAGE_ANCESTORS) {
    const key = String(current.id)

    if (visited.has(key)) break

    visited.add(key)
    chain.unshift(current)
    current = isPageDoc(current.parent) ? current.parent : null
  }

  const segments: string[] = []
  const resolved: ResolvedPageBreadcrumb[] = [{ label: 'Home', url: '/' }]

  for (const entry of chain) {
    const label = entry.title?.trim()
    const slug = entry.slug?.trim()

    if (!label || !slug) continue

    segments.push(slug)
    resolved.push({ label, url: `/${segments.join('/')}` })
  }

  return resolved
}

export function resolveCustomPageBreadcrumbs(
  items: ManualBreadcrumbInput[] | null | undefined,
): ResolvedPageBreadcrumb[] {
  return (items ?? []).flatMap((item) => {
    const label = item.label?.trim()

    if (!label) return []

    const url =
      item.linkType === 'page'
        ? getPageHref(item.page)
        : item.linkType === 'custom'
          ? item.url?.trim() || undefined
          : undefined

    return [{ label, url }]
  })
}

export function resolvePageHeaderBreadcrumbs({
  automatic,
  breadcrumbMode = 'automatic',
  breadcrumbs,
}: {
  automatic: ResolvedPageBreadcrumb[]
  breadcrumbMode?: BreadcrumbMode | null
  breadcrumbs?: ManualBreadcrumbInput[] | null
}): ResolvedPageBreadcrumb[] {
  if (breadcrumbMode === 'hidden') return []
  if (breadcrumbMode === 'custom') return resolveCustomPageBreadcrumbs(breadcrumbs)

  return automatic
}

function findFirstPageHeader(
  blocks: Page['layout'] | null | undefined,
  depth = 0,
): PageHeaderBreadcrumbSource | null {
  if (!blocks?.length || depth > MAX_REUSABLE_SECTION_DEPTH) return null

  for (const block of blocks) {
    if (block.blockType === 'pageHeader') {
      return block as PageHeaderBreadcrumbSource
    }

    if (block.blockType !== 'reusableSection') continue

    const section = block.section
    if (!section || typeof section !== 'object') continue

    const nested = findFirstPageHeader((section as ReusableSectionSource).layout, depth + 1)

    if (nested) return nested
  }

  return null
}

export function resolvePageBreadcrumbsForLayout(
  page: Page,
  options: { isHomepage?: boolean } = {},
): ResolvedPageBreadcrumb[] {
  const automatic = resolveAutomaticPageBreadcrumbs(page, options)
  const pageHeader = findFirstPageHeader(page.layout)

  if (!pageHeader) return automatic

  return resolvePageHeaderBreadcrumbs({
    automatic,
    breadcrumbMode: pageHeader.breadcrumbMode,
    breadcrumbs: pageHeader.breadcrumbs,
  })
}

export function toBreadcrumbListStructuredData(
  items: ResolvedPageBreadcrumb[],
  toAbsoluteUrl: (url: string) => string,
) {
  if (items.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      ...(item.url ? { item: toAbsoluteUrl(item.url) } : {}),
      name: item.label,
      position: index + 1,
    })),
  }
}

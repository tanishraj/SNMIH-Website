/**
 * Admin-only fields on Payload Media documents that the frontend never reads.
 */
const MEDIA_INTERNAL_FIELDS = new Set([
  'storageStatus',
  'storageCheckedAt',
  'storageMissingSince',
  'storageIssue',
  'usageSummary',
  'usageDetails',
  'isCriticalAsset',
  'replacementNotes',
  'notes',
  'tags',
  'thumbnailURL',
  'title', // internal admin label, not the public alt text
  '_status',
  'updatedAt',
  'createdAt',
  'deletedAt',
])

/**
 * Fields to keep when a Page document appears as a *nested* value (e.g. the
 * `page` field on a CTA action button or hero button).
 *
 * The frontend only needs navigation data from linked pages — slug + parent
 * chain for URL construction, ogImage for page cards, basic title/description.
 * The `layout` field (array of blocks) is the large part and is never used
 * by block components that merely link to another page.
 */
const NESTED_PAGE_KEEP = new Set([
  'id',
  'slug',
  'title',
  'parent',
  'publicUrlPreview',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'metaTitle',
  'metaDescription',
  'publishedAt',
  '_status',
])

function isMediaDocument(obj: Record<string, unknown>): boolean {
  return typeof obj.mimeType === 'string' || 'usageDetails' in obj
}

function isPageDocument(obj: Record<string, unknown>): boolean {
  // Top-level Pages can omit the optional parent field entirely. Use their
  // routing/SEO fields too; Headers and Footers also have slug + layout.
  return (
    typeof obj.slug === 'string' &&
    'layout' in obj &&
    ('parent' in obj ||
      'includeInSitemap' in obj ||
      'robotsMode' in obj ||
      'publicUrlPreview' in obj)
  )
}

/**
 * Recursively strips data that would push Payload page documents past Next.js's
 * 2 MB per-item `unstable_cache` limit:
 *
 * 1. **Media documents** — strips internal admin-only fields (`usageDetails`,
 *    `usageSummary`, `storageStatus`, etc.). Detection: `mimeType` present OR
 *    `usageDetails` key present.
 *
 * 2. **Nested Page documents** — when a Page document appears as a relationship
 *    value inside a block (e.g. `cta.actions[].page`, `heroBanner.buttons[].page`,
 *    `qaAccordion.sideColumn.actions[].page`), its `layout` and other heavy fields
 *    are stripped. Only the fields needed for URL construction and page cards are
 *    kept. The *root* Page being fetched is never stripped this way — pass
 *    `isRootDocument = true` for the initial call.
 *
 * This typically reduces a depth-2 page payload from 14–16 MB to well under 2 MB.
 */
export function stripInternalMediaFields<T>(value: T, isRootDocument = false): T {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => stripInternalMediaFields(v)) as unknown as T

  const obj = value as Record<string, unknown>

  // ── Media document ────────────────────────────────────────────────────────
  if (isMediaDocument(obj)) {
    const stripped: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      if (!MEDIA_INTERNAL_FIELDS.has(key)) stripped[key] = obj[key]
    }
    return stripped as unknown as T
  }

  // ── Nested Page document ──────────────────────────────────────────────────
  // Keep only navigation + card fields; drop `layout` and all editorial data.
  if (!isRootDocument && isPageDocument(obj)) {
    const stripped: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      if (NESTED_PAGE_KEEP.has(key)) {
        // Recurse so that the parent chain is also stripped and ogImage Media
        // fields are cleaned up.
        stripped[key] = stripInternalMediaFields(obj[key])
      }
    }
    return stripped as unknown as T
  }

  // ── Everything else ───────────────────────────────────────────────────────
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, stripInternalMediaFields(v)]),
  ) as unknown as T
}

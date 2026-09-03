import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { normalizeBlockBackground } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import { cardSurfaceValues, type CardSurfaceValue } from '@/blocks/shared/cardThemeFields'
import {
  normalizeMediaOverlayCoverage,
  normalizeMediaOverlayDirection,
  normalizeMediaOverlayStrength,
  normalizeMediaOverlayTone,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import type { Page } from '@/payload-types'

export type FeaturedImageRatio = 'standard' | 'video' | 'wide'

export type NewsEventDetailTemplateBlock = {
  id?: string | null
  blockName?: string | null
  blockType: string
  [key: string]: unknown
}

export type ResolvedNewsEventDetailTemplate = {
  layout: NewsEventDetailTemplateBlock[]
}

export type NewsEventDetailPageBlock = NonNullable<Page['layout']>[number]

export type ResolvedNewsEventsContentSettings = {
  appearance: BlockAppearance
  authorLabel: string
  coverage: MediaOverlayCoverage
  direction: MediaOverlayDirection
  featuredImageRatio: FeaturedImageRatio
  showShareActions: boolean
  sidebarCardBackground: CardSurfaceValue
  sidebarCardOutline: boolean
  size: RegularBlockSize
  strength: MediaOverlayStrength
  tone: MediaOverlayTone
}

export const DEFAULT_NEWS_EVENTS_CONTENT_BLOCK: NewsEventDetailTemplateBlock = {
  blockType: 'newsEventsContent',
  appearance: { background: 'none', border: 'none' },
  authorLabel: 'Management, SNMIH',
  featuredImageRatio: 'wide',
  overlayCoverage: 'full',
  overlayDirection: 'bottomToTop',
  overlayStyle: 'darker',
  showShareActions: true,
  sidebarCardBackground: 'default',
  sidebarCardOutline: true,
  size: 'default',
  themeMode: 'dark',
}

export const DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE: ResolvedNewsEventDetailTemplate = {
  layout: [
    {
      blockType: 'pageHeader',
      appearance: { background: 'none', border: 'none' },
      contentAlignment: 'left',
      contentWidth: 'default',
      eyebrow: 'News & Events',
      height: 'default',
      size: 'default',
      subtitle: 'Stay informed about news, events, notices, and announcements from SNMIH.',
      title: 'Latest updates from SNMIH',
      topContent: 'eyebrow',
      variant: 'minimal',
    },
    {
      blockType: 'breadcrumb',
      alignment: 'left',
      appearance: { background: 'none', border: 'none' },
      breadcrumbMode: 'automatic',
      sectionPadding: 'compact',
      separator: 'chevron',
      showCurrentPage: true,
      showHome: true,
      size: 'default',
    },
    DEFAULT_NEWS_EVENTS_CONTENT_BLOCK,
  ],
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const isTemplateBlock = (value: unknown): value is NewsEventDetailTemplateBlock =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as { blockType?: unknown }).blockType === 'string',
  )

const cloneTemplateBlock = (block: NewsEventDetailTemplateBlock): NewsEventDetailTemplateBlock =>
  structuredClone(block)

const cloneTemplateLayout = (
  layout: NewsEventDetailTemplateBlock[],
): NewsEventDetailTemplateBlock[] => layout.map(cloneTemplateBlock)

const fromAllowedValues = <Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  fallback: Value,
): Value =>
  typeof value === 'string' && allowed.includes(value as Value) ? (value as Value) : fallback

const trimmed = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  return value.trim() || undefined
}

export function normalizeNewsEventDetailTemplate(value: unknown): ResolvedNewsEventDetailTemplate {
  const rawLayout = asRecord(value).layout
  if (!Array.isArray(rawLayout) || rawLayout.length === 0) {
    return { layout: cloneTemplateLayout(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout) }
  }

  const validBlocks = rawLayout.filter(isTemplateBlock)
  if (validBlocks.length === 0) {
    return { layout: cloneTemplateLayout(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout) }
  }

  let foundContent = false
  const layout = validBlocks.filter((block) => {
    if (block.blockType !== 'newsEventsContent') return true
    if (foundContent) return false
    foundContent = true
    return true
  })

  if (!foundContent) layout.push(DEFAULT_NEWS_EVENTS_CONTENT_BLOCK)
  return { layout: cloneTemplateLayout(layout) }
}

export function resolveNewsEventsContentSettings(
  value: unknown,
): ResolvedNewsEventsContentSettings {
  const block = asRecord(value)
  const appearance = asRecord(block.appearance)
  const direction = normalizeMediaOverlayDirection(trimmed(block.overlayDirection), 'bottomToTop')

  return {
    appearance: {
      background: normalizeBlockBackground(trimmed(appearance.background)),
      border: fromAllowedValues(
        appearance.border,
        ['none', 'top', 'bottom', 'topAndBottom'] as const,
        'none',
      ),
    },
    authorLabel: trimmed(block.authorLabel) ?? 'Management, SNMIH',
    coverage: normalizeMediaOverlayCoverage(trimmed(block.overlayCoverage), direction),
    direction,
    featuredImageRatio: fromAllowedValues(
      block.featuredImageRatio,
      ['wide', 'video', 'standard'] as const,
      'wide',
    ),
    showShareActions: typeof block.showShareActions === 'boolean' ? block.showShareActions : true,
    sidebarCardBackground: fromAllowedValues(
      block.sidebarCardBackground,
      cardSurfaceValues,
      'default',
    ),
    sidebarCardOutline:
      typeof block.sidebarCardOutline === 'boolean' ? block.sidebarCardOutline : true,
    size: fromAllowedValues(
      block.size,
      ['none', 'compact', 'default', 'comfortable'] as const,
      'default',
    ),
    strength: normalizeMediaOverlayStrength(trimmed(block.overlayStyle), 'darker'),
    tone: normalizeMediaOverlayTone(trimmed(block.themeMode), 'dark'),
  }
}

export function getNewsEventDetailAuthorLabel(template: ResolvedNewsEventDetailTemplate): string {
  const content = template.layout.find(({ blockType }) => blockType === 'newsEventsContent')
  return resolveNewsEventsContentSettings(content).authorLabel
}

export function getNewsEventDetailPageBlocks(
  template: ResolvedNewsEventDetailTemplate,
): NewsEventDetailPageBlock[] {
  const pageBlocks: NewsEventDetailPageBlock[] = []

  // Payload owns the allowed global block registry. Normalization keeps a looser runtime shape so
  // legacy documents can fall back safely; the dynamic-only block is the sole non-Page member.
  const collect = (layout: NewsEventDetailTemplateBlock[], depth = 0) => {
    if (depth > 10) return

    for (const block of layout) {
      if (block.blockType === 'newsEventsContent') continue

      pageBlocks.push(block as unknown as NewsEventDetailPageBlock)

      if (block.blockType !== 'reusableSection') continue

      const innerLayout = asRecord(block.section).layout
      if (!Array.isArray(innerLayout)) continue

      collect(innerLayout.filter(isTemplateBlock), depth + 1)
    }
  }

  collect(template.layout)
  return pageBlocks
}

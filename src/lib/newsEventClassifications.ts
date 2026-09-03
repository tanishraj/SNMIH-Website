export const NEWS_EVENT_CLASSIFICATIONS = [
  { adminLabel: 'News', label: 'News', tabLabel: 'News', value: 'news' },
  { adminLabel: 'Events', label: 'Event', tabLabel: 'Events', value: 'event' },
  { adminLabel: 'Notice', label: 'Notice', tabLabel: 'Notice', value: 'notice' },
  { adminLabel: 'Holiday', label: 'Holiday', tabLabel: 'Holiday', value: 'holiday' },
  {
    adminLabel: 'Achievements',
    label: 'Achievement',
    tabLabel: 'Achievements',
    value: 'achievement',
  },
  {
    adminLabel: 'Announcement',
    label: 'Announcement',
    tabLabel: 'Announcement',
    value: 'announcement',
  },
  { adminLabel: 'Others', label: 'Other', tabLabel: 'Others', value: 'other' },
] as const

export type LegacyNewsEventClassification = (typeof NEWS_EVENT_CLASSIFICATIONS)[number]['value']
/** @deprecated Use a resolved News & Event Classification relationship. */
export type NewsEventClassification = LegacyNewsEventClassification
export type NewsEventClassificationTab = 'all' | NewsEventClassification

export const NEWS_EVENT_CLASSIFICATION_DEFAULTS = [
  {
    badgeLabel: 'News',
    behavior: 'story',
    legacyValue: 'news',
    slug: 'news',
    title: 'News',
  },
  {
    badgeLabel: 'Event',
    behavior: 'event',
    legacyValue: 'event',
    slug: 'event',
    title: 'Events',
  },
  {
    badgeLabel: 'Notice',
    behavior: 'story',
    legacyValue: 'notice',
    slug: 'notice',
    title: 'Notice',
  },
  {
    badgeLabel: 'Holiday',
    behavior: 'story',
    legacyValue: 'holiday',
    slug: 'holiday',
    title: 'Holiday',
  },
  {
    badgeLabel: 'Achievement',
    behavior: 'story',
    legacyValue: 'achievement',
    slug: 'achievement',
    title: 'Achievements',
  },
  {
    badgeLabel: 'Announcement',
    behavior: 'story',
    legacyValue: 'announcement',
    slug: 'announcement',
    title: 'Announcement',
  },
  {
    badgeLabel: 'Other',
    behavior: 'story',
    legacyValue: 'other',
    slug: 'other',
    title: 'Others',
  },
] as const

export type NewsEventClassificationBehavior = 'event' | 'story'

export const CALENDAR_TONES = ['green', 'blue', 'cyan', 'amber', 'violet'] as const
export type CalendarTone = (typeof CALENDAR_TONES)[number]

export const normalizeCalendarTone = (value: unknown): CalendarTone =>
  CALENDAR_TONES.includes(value as CalendarTone) ? (value as CalendarTone) : 'blue'

export type ResolvedNewsEventClassification = {
  active: boolean
  badgeLabel: string
  behavior: NewsEventClassificationBehavior
  calendarColor: CalendarTone
  id: string
  legacyValue: LegacyNewsEventClassification | null
  slug: string
  title: string
}

const getRelationshipID = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim() || null
  }

  if (!value || typeof value !== 'object' || Array.isArray(value) || !('id' in value)) {
    return null
  }

  const id = value.id

  return typeof id === 'string' || typeof id === 'number' ? String(id).trim() || null : null
}

export function getNewsEventClassificationRelationshipIDs(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()

  return value.flatMap((entry): string[] => {
    const id = getRelationshipID(entry)

    if (!id || seen.has(id)) return []

    seen.add(id)
    return [id]
  })
}

const normalizeRequiredString = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const normalized = String(value).trim()

  return normalized || null
}

export const normalizeNewsEventClassificationRecord = (
  value: unknown,
): ResolvedNewsEventClassification | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const id = normalizeRequiredString(record.id)
  const slug = normalizeRequiredString(record.slug)
  const title = normalizeRequiredString(record.title)

  if (!id || !slug || !title) return null

  const badgeLabel = normalizeRequiredString(record.badgeLabel) ?? title
  const legacyValue = classificationValues.has(record.legacyValue as LegacyNewsEventClassification)
    ? (record.legacyValue as LegacyNewsEventClassification)
    : null

  return {
    active: record.active !== false,
    badgeLabel,
    behavior: record.behavior === 'event' ? 'event' : 'story',
    calendarColor: normalizeCalendarTone(record.calendarColor),
    id,
    legacyValue,
    slug,
    title,
  }
}

const classificationValues = new Set<LegacyNewsEventClassification>(
  NEWS_EVENT_CLASSIFICATIONS.map(({ value }) => value),
)

export const normalizeLegacyNewsEventClassification = (
  value: unknown,
): LegacyNewsEventClassification | null =>
  classificationValues.has(value as LegacyNewsEventClassification)
    ? (value as LegacyNewsEventClassification)
    : null

export const getLegacyNewsEventClassificationRecord = (
  value: unknown,
): ResolvedNewsEventClassification | null => {
  const legacyValue = normalizeLegacyNewsEventClassification(value)
  if (!legacyValue) return null

  const record = NEWS_EVENT_CLASSIFICATION_DEFAULTS.find(
    (candidate) => candidate.legacyValue === legacyValue,
  )
  if (!record) return null

  return {
    active: true,
    badgeLabel: record.badgeLabel,
    behavior: record.behavior,
    calendarColor: 'blue',
    id: `legacy:${record.legacyValue}`,
    legacyValue: record.legacyValue,
    slug: record.slug,
    title: record.title,
  }
}

/**
 * Resolves the current relationship first and retains the hidden legacy value
 * only as a compatibility fallback for records that have not been migrated yet.
 */
export const resolveNewsEventClassificationRecord = (
  classification: unknown,
  legacyValue?: unknown,
): ResolvedNewsEventClassification | null =>
  normalizeNewsEventClassificationRecord(classification) ??
  getLegacyNewsEventClassificationRecord(legacyValue)

export const NEWS_EVENT_CLASSIFICATION_TABS = [
  { label: 'All', value: 'all' },
  ...NEWS_EVENT_CLASSIFICATIONS.map(({ tabLabel, value }) => ({ label: tabLabel, value })),
] as const satisfies ReadonlyArray<{ label: string; value: NewsEventClassificationTab }>

const classificationLabels = Object.fromEntries(
  NEWS_EVENT_CLASSIFICATIONS.map(({ label, value }) => [value, label]),
) as Record<NewsEventClassification, string>

export function getNewsEventClassificationLabel(value?: string | null): string {
  return classificationLabels[normalizeNewsEventClassification(value)]
}

export function normalizeNewsEventClassification(value?: string | null): NewsEventClassification {
  return classificationValues.has(value as NewsEventClassification)
    ? (value as NewsEventClassification)
    : 'other'
}

export function isEventClassification(value?: string | null): boolean {
  return value === 'event'
}

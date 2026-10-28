import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { CmsActionValue } from '@/lib/cmsLinks'

export const sectionOptions = [
  { label: 'Institution', value: 'institution' },
  { label: 'Statistics', value: 'statistics' },
  { label: 'Courses & students', value: 'courses' },
  { label: 'Surgeries', value: 'surgeries' },
  { label: 'Departments & faculty', value: 'faculty' },
  { label: 'Hostel & records', value: 'hostel' },
  { label: 'Publications', value: 'publications' },
] as const
export type SectionKey = (typeof sectionOptions)[number]['value']
export type Column = { key: string; label: string; numeric?: boolean | null }
export type Group = {
  key: string
  title?: string | null
  layout: 'facts' | 'metrics' | 'table'
  columns?: Column[] | null
}
export type Section = {
  key: SectionKey
  label: string
  description?: string | null
  enabled?: boolean | null
  groups: Group[]
}
const column = (key: string, label: string, numeric = false): Column => ({ key, label, numeric })
export const defaultSections: Section[] = [
  {
    key: 'institution',
    label: 'Institution',
    description: 'College identity, affiliations and teaching hospital.',
    groups: [
      { key: 'profile', title: 'College profile', layout: 'facts' },
      { key: 'leadership', title: 'Leadership', layout: 'facts' },
      { key: 'hospital', title: 'Teaching hospital', layout: 'facts' },
    ],
  },
  {
    key: 'statistics',
    label: 'Statistics',
    description: 'Hospital activity for the selected reporting period.',
    groups: [
      { key: 'highlights', layout: 'metrics' },
      { key: 'monthly', title: 'Monthly records', layout: 'facts' },
      { key: 'annual', title: 'Annual overview', layout: 'facts' },
    ],
  },
  {
    key: 'courses',
    label: 'Courses & students',
    description: 'Permitted intake and admissions for the selected reporting period.',
    groups: [
      { key: 'intake', title: 'Permitted intake', layout: 'metrics' },
      {
        key: 'programmes',
        title: 'Postgraduate programmes',
        layout: 'table',
        columns: [
          column('programme', 'Programme'),
          column('commencement', 'Commencement · LoP'),
          column('pursuing', 'Pursuing', true),
          column('admitted', 'Admitted', true),
        ],
      },
      { key: 'session', title: 'Session details', layout: 'facts' },
    ],
  },
  {
    key: 'surgeries',
    label: 'Surgeries',
    groups: [
      {
        key: 'procedures',
        title: 'Surgical activity',
        layout: 'table',
        columns: [
          column('department', 'Department'),
          column('major', 'Major procedures', true),
          column('minor', 'Minor procedures', true),
        ],
      },
    ],
  },
  {
    key: 'faculty',
    label: 'Departments & faculty',
    description: 'Qualifications, appointments and teaching records.',
    groups: [
      {
        key: 'register',
        title: 'Faculty register',
        layout: 'table',
        columns: [
          column('name', 'Faculty member'),
          column('department', 'Department'),
          column('qualification', 'Qualification'),
          column('imr', 'IMR number'),
          column('designation', 'Designation'),
        ],
      },
      { key: 'facilities', title: 'Department facilities', layout: 'facts' },
    ],
  },
  {
    key: 'hostel',
    label: 'Hostel & records',
    groups: [
      {
        key: 'accommodation',
        title: 'Hostel accommodation',
        layout: 'table',
        columns: [
          column('name', 'Accommodation'),
          column('rooms', 'Rooms', true),
          column('students', 'Students accommodated', true),
        ],
      },
      { key: 'grievance', title: 'Grievance redressal', layout: 'facts' },
      { key: 'reporting', title: 'Statutory reporting', layout: 'facts' },
    ],
  },
  {
    key: 'publications',
    label: 'Publications',
    description: 'Faculty publications in Vancouver referencing style.',
    groups: [
      {
        key: 'publications',
        layout: 'table',
        columns: [
          column('faculty', 'Faculty member'),
          column('citation', 'Publication · Vancouver style'),
          column('pubmed', 'Pubmed indexed'),
          column('scopes', 'Scopes'),
        ],
      },
    ],
  },
]
export type DisclosureBlockLike = {
  dataset?: string | { id: string } | null
  title?: string | null
  accentTitle?: string | null
  eyebrow?: string | null
  description?: string | null
  sections?: Section[] | null
  defaultSection?: SectionKey | null
  appearance?: BlockAppearance | null
  size?: 'none' | 'compact' | 'default' | 'comfortable' | null
  sidebarWidth?: 'standard' | 'wide' | null
  density?: 'compact' | 'comfortable' | null
  contentAlignment?: 'left' | 'center' | null
  headerLayout?: 'split' | 'stacked' | null
  showSectionNumbers?: boolean | null
  missingValueStyle?: 'chip' | 'footnote' | 'text' | null
  itemsPerPage?: string | null
  paginationMode?: 'pages' | 'loadMore' | null
  emptyMessage?: string | null
  emptyDescription?: string | null
  missingMessage?: string | null
  archiveNote?: string | null
  actions?: CmsActionValue[] | null
  footerActions?: CmsActionValue[] | null
  publicUpdatedAt?: string | null
  publicUpdatedBy?: string | null
}
export type Row = {
  id: string
  label: string
  value?: string | null
  valueState?: string | null
  cells?: { key: string; value?: string | null; valueState?: string | null }[] | null
  details?: { label: string; value?: string | null }[] | null
}
export type Batch = { rows: Row[]; total: number; page: number; totalPages: number }
export type Snapshot = {
  timeZone?: string
  dataset: string
  periods: { id: string; label: string }[]
  hasMorePeriods: boolean
  periodPage: number
  period: string
  updatedAt?: string | null
  updatedBy?: string | null
  updatedLabel?: string | null
  groups: Record<string, Batch>
}
export const relationshipID = (v: DisclosureBlockLike['dataset']) =>
  typeof v === 'string' ? v : (v?.id ?? '')
export const normalizeSections = (sections: Section[] | null | undefined): Section[] =>
  (sections ?? defaultSections)
    .filter(
      (s) => s && s.enabled !== false && sectionOptions.some((option) => option.value === s.key),
    )
    .map((s) => ({
      ...s,
      label: s.label?.trim() || sectionOptions.find((option) => option.value === s.key)!.label,
      groups: (s.groups ?? [])
        .filter((g) => g && typeof g.key === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(g.key))
        .map((g) => ({
          ...g,
          layout: ['facts', 'metrics', 'table'].includes(g.layout) ? g.layout : 'facts',
          columns: (g.columns ?? []).filter(
            (c) => c && typeof c.key === 'string' && c.key.trim() && c.label?.trim(),
          ),
        })),
    }))
export const defaultEmptyDescription =
  'Figures for this section have not been published yet. Earlier reporting periods remain available from the period selector above.'
/** Rows per table page. Nothing shows more than ten rows at once; larger stored values fall back. */
export const PAGE_SIZES = [5, 10] as const
export const normalizeLimit = (v: unknown) =>
  (PAGE_SIZES as readonly number[]).includes(Number(v)) ? Number(v) : 10
export const missingKind = (value: string | null | undefined, state?: string | null) =>
  state === 'notApplicable'
    ? 'notApplicable'
    : state === 'notSupplied' || value == null || value.trim() === ''
      ? 'notSupplied'
      : null
export const displayValue = (
  value: string | null | undefined,
  state?: string | null,
  missing = 'Not supplied',
) => {
  const kind = missingKind(value, state)
  return kind === 'notApplicable' ? 'Not applicable' : kind ? missing : (value as string)
}

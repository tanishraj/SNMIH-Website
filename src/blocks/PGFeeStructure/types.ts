import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type {
  FeeDocumentDownloadActionMode,
  FeeDocumentDownloadButtonVariant,
} from '@/blocks/shared/FeeDocumentDownload'
import type { CmsActionValue } from '@/lib/cmsLinks'
import type { Media } from '@/payload-types'

export type PGFeeColumnValueMode = 'department' | 'shared'
export type PGFeeTabStyle = 'boxed' | 'pills' | 'underline'
export type PGFeeTabWidth = 'centered' | 'content' | 'equal'

export type PGFeeVariableValue = {
  id?: string | null
  value?: string | null
}

export type PGFeeColumnValue = {
  id?: string | null
  label?: string | null
  sharedValue?: string | null
  valueMode?: PGFeeColumnValueMode | null
}

export type PGFeeDepartmentValue = {
  id?: string | null
  name?: string | null
  note?: string | null
  variableValues?: PGFeeVariableValue[] | null
}

export type PGFeeNoteValue = {
  emphasis?: boolean | null
  id?: string | null
  text?: string | null
}

export type PGFeeCategoryValue = {
  caption?: string | null
  columns?: PGFeeColumnValue[] | null
  departments?: PGFeeDepartmentValue[] | null
  id?: string | null
  label?: string | null
  notes?: PGFeeNoteValue[] | null
}

export type ResolvedPGFeeColumn = {
  id: string
  label: string
  sharedValue?: string
  valueMode: PGFeeColumnValueMode
}

export type ResolvedPGFeeDepartment = {
  cells: string[]
  id: string
  name: string
  note?: string
}

export type ResolvedPGFeeNote = {
  emphasis: boolean
  id: string
  text: string
}

export type ResolvedPGFeeCategory = {
  caption?: string
  columns: ResolvedPGFeeColumn[]
  departments: ResolvedPGFeeDepartment[]
  id: string
  label: string
  notes: ResolvedPGFeeNote[]
}

export type PGFeeStructureBlockLike = {
  academicSession?: string | null
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  downloadActionMode?: FeeDocumentDownloadActionMode | null
  downloadAppearance?: BlockAppearance | null
  downloadButtonVariant?: FeeDocumentDownloadButtonVariant | null
  downloadLabel?: string | null
  eyebrow?: string | null
  feeCategories?: PGFeeCategoryValue[] | null
  feeDocumentAction?: CmsActionValue[] | null
  feeDocument?: Media | string | number | null
  footerActions?: CmsActionValue[] | null
  programmeName?: string | null
  size?: RegularBlockSize | null
  tabStyle?: PGFeeTabStyle | null
  tabWidth?: PGFeeTabWidth | null
  title?: string | null
}

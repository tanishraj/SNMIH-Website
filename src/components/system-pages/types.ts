import type { BlockAppearance } from '@/blocks/shared/blockAppearance'

export type SystemPageVariant = 'comingSoon' | 'maintenance' | 'notFound'

export type SystemPageActionLink = {
  label: string
  openInNewTab?: boolean | null
  url: string
}

export type SystemPageViewProps = {
  appearance?: BlockAppearance | null
  badge?: string | null
  description?: string | null
  heading: string
  primaryAction?: SystemPageActionLink | null
  secondaryAction?: SystemPageActionLink | null
  statusDisplay?: string | null
  supportingNote?: string | null
}

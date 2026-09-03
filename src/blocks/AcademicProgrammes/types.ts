export type AcademicProgrammesViewMode = 'detailedCards' | 'grid' | 'list'

export type ResolvedProgrammeImage = {
  alt: string
  height?: number
  src: string
  width?: number
}

export type ResolvedProgrammeFact = {
  icon?: string
  label: string
  value: string
}

export type ResolvedAcademicProgramme = {
  badge?: string
  cardBackground?: string | null
  ctaLabel: string
  description?: string
  duration?: string
  durationLabel?: string
  eyebrow?: string
  facts: ResolvedProgrammeFact[]
  href?: string
  icon?: string
  id: number | string
  image?: ResolvedProgrammeImage
  intake?: string
  intakeLabel?: string
  openInNewTab: boolean
  title: string
}

import { Logos20, type Logos20Item } from '@/components/logos20'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type { CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'
import { resolveLogoRows, type LogoItems, type LogoRowsData } from './rows'

type Logos20BlockLike = LogoRowsData & {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | 'right' | null
  description?: string | null
  enableMotion?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  grayscale?: boolean | null
  logoHeight?: 'sm' | 'md' | 'lg' | null
  showLabels?: boolean | null
  showPauseControl?: boolean | null
  size?: RegularBlockSize | null
  speed?: 'slow' | 'normal' | 'fast' | null
  title?: string | null
}

const resolveRow = (row?: LogoItems): Logos20Item[] =>
  (row ?? []).flatMap((item, index) => {
    const name = item.name?.trim()
    const image = getMediaImageProps({
      media: item.image as Media | string | number | null,
      preset: 'logo',
      fallbackAlt: name,
    })
    return name && image ? [{ id: item.id || String(index), name, image }] : []
  })

export function Logos20BlockComponent({
  topRow,
  bottomRow,
  additionalRows,
  rows,
  ...props
}: Logos20BlockLike) {
  const resolvedRows = resolveLogoRows({ rows, topRow, bottomRow, additionalRows }).map(
    (row, index) => ({
      id: row.id || String(index),
      logos: resolveRow(row.logos),
    }),
  )
  if (!resolvedRows.some((row) => row.logos.length)) return null
  return <Logos20 {...props} rows={resolvedRows} />
}

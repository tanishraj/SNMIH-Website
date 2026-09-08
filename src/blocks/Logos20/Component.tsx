import { Logos20, type Logos20Item } from '@/components/logos20'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type { CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'

type LogoRow = { id?: string | null; name?: string | null; image?: unknown }[] | null

type Logos20BlockLike = {
  additionalRows?: { id?: string | null; logos?: LogoRow }[] | null
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  bottomRow?: LogoRow
  contentAlignment?: 'left' | 'center' | 'right' | null
  description?: string | null
  enableMotion?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  grayscale?: boolean | null
  logoHeight?: 'sm' | 'md' | 'lg' | null
  showLabels?: boolean | null
  size?: RegularBlockSize | null
  speed?: 'slow' | 'normal' | 'fast' | null
  title?: string | null
  topRow?: LogoRow
}

const resolveRow = (row?: LogoRow): Logos20Item[] =>
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
  ...props
}: Logos20BlockLike) {
  const top = resolveRow(topRow)
  const bottom = resolveRow(bottomRow)
  const extra = (additionalRows ?? []).map((row, index) => ({
    id: row.id || String(index),
    logos: resolveRow(row.logos),
  }))
  if (!top.length && !bottom.length && !extra.some((row) => row.logos.length)) return null
  return <Logos20 {...props} topRow={top} bottomRow={bottom} additionalRows={extra} />
}

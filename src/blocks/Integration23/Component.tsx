import { Integration23, type Integration23Item } from '@/components/integration23'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'

type Integration23BlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: '1' | '2' | '3' | '4' | '6' | null
  contentAlignment?: 'left' | 'center' | 'right' | null
  description?: string | null
  enableDetails?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  items?:
    | {
        id?: string | null
        name?: string | null
        logo?: unknown
        description?: string | null
        actions?: CmsActionValue[] | null
      }[]
    | null
  layoutMode?: 'stacked' | 'split' | null
  gridPosition?: 'left' | 'right' | null
  splitProportion?: 'balanced' | 'directoryFocus' | 'sectionFocus' | null
  itemLayout?: 'inline' | 'block' | null
  itemAlignment?: 'left' | 'center' | null
  gridStyle?: 'grid' | 'ruled' | null
  sectionVerticalAlignment?: 'top' | 'center' | 'bottom' | null
  size?: RegularBlockSize | null
  title?: string | null
}

export function Integration23BlockComponent({ items, ...props }: Integration23BlockLike) {
  const resolvedItems = (items ?? []).flatMap((item, index): Integration23Item[] => {
    const name = item.name?.trim()
    if (!name) return []

    return [
      {
        id: item.id || String(index),
        name,
        image: getMediaImageProps({
          media: item.logo as Media | string | number | null,
          preset: 'logo',
          fallbackAlt: name,
        }),
        description: item.description?.trim() || undefined,
        actions: resolveCmsActions(item.actions),
      },
    ]
  })

  if (!resolvedItems.length) return null

  return <Integration23 {...props} items={resolvedItems} />
}

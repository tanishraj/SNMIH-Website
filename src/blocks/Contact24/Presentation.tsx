import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { Contact24, type Contact24DetailsAlignment, type Contact24MapActionMode, type Contact24MapActionVariant } from '@/components/contact24'
import { ContentActions } from '@/components/ContentActions'
import { resolveCmsActions, type CmsActionValue, type CmsActionVariant } from '@/lib/cmsLinks'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'

export type Contact24BlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  detailsAlignment?: Contact24DetailsAlignment | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  mapActionLabel?: string | null
  mapActionMode?: 'button' | 'link' | null
  mapActionVariant?: CmsActionVariant | null
  offices?: (string | { id: string })[] | null
  showAddressDetails?: boolean | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

export function Contact24BlockPresentation({
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  detailsAlignment = 'left',
  eyebrow,
  footerActions,
  mapActionLabel,
  mapActionMode,
  mapActionVariant,
  offices,
  showAddressDetails = true,
  size = 'default',
  title,
}: Contact24BlockLike & { offices: SiteOfficeLocation[] }) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  const resolvedActions = resolveCmsActions(actions)

  return (
    <>
      <Contact24
        actions={resolvedActions.length > 0 ? <ContentActions actions={resolvedActions} /> : undefined}
        appearance={appearance}
        contentAlignment={contentAlignment ?? 'center'}
        description={description?.trim()}
        detailsAlignment={detailsAlignment ?? 'left'}
        eyebrow={eyebrow?.trim()}
        mapActionLabel={mapActionLabel?.trim() || 'View on Map'}
        mapActionMode={(mapActionMode as Contact24MapActionMode) ?? 'link'}
        mapActionVariant={(mapActionVariant as Contact24MapActionVariant) ?? 'outline'}
        offices={offices}
        showLocationDetails={showAddressDetails ?? true}
        size={size ?? 'default'}
        title={resolvedTitle}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}

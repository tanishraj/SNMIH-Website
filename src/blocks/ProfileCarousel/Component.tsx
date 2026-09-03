import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { ContentActions } from '@/components/ContentActions'
import {
  ProfileCarousel,
  type ProfileCarouselAlignment,
  type ProfileCarouselCardVariant,
  type ProfileCarouselImagePosition,
  type ProfileCarouselOverlayAlignment,
  type ProfileCarouselProfile,
  type ProfileCarouselSize,
} from '@/components/profile-carousel'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'

type ProfileCarouselBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardVariant?: ProfileCarouselCardVariant | null
  contentAlignment?: ProfileCarouselAlignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  profiles?:
    | {
        cardBackground?: string | null
        department?: string | null
        image?: unknown
        imagePosition?: ProfileCarouselImagePosition | null
        name?: string | null
        role?: string | null
      }[]
    | null
  overlayAlignment?: ProfileCarouselOverlayAlignment | null
  size?: ProfileCarouselSize | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

export function ProfileCarouselBlockComponent({
  accentTitle,
  actions,
  appearance,
  cardVariant = 'stacked',
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  overlayAlignment = 'left',
  overlayCoverage = 'full',
  overlayDirection = 'bottomToTop',
  overlayStyle = 'dark',
  profiles,
  size = 'default',
  themeMode = 'auto',
  title,
}: ProfileCarouselBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedProfiles = (profiles ?? []).flatMap((profile): ProfileCarouselProfile[] => {
    const name = profile.name?.trim()
    const image = getMediaImageProps({
      fallbackAlt: name,
      media: profile.image as never,
      preset: 'generic',
    })

    return name && image
      ? [
          {
            cardBackground: profile.cardBackground,
            department: profile.department?.trim() || undefined,
            image,
            imagePosition: profile.imagePosition,
            name,
            role: profile.role?.trim() || undefined,
          },
        ]
      : []
  })

  if (!resolvedTitle || !resolvedProfiles.length) {
    return null
  }

  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedActions = resolveCmsActions(actions).slice(0, 1)

  return (
    <>
      <ProfileCarousel
        accentTitle={accentTitle}
        actions={
          <ContentActions
            actions={resolvedActions}
            alignment={resolvedAlignment}
            data-profile-carousel-actions="true"
          />
        }
        alignment={resolvedAlignment}
        appearance={appearance}
        cardVariant={cardVariant ?? 'stacked'}
        description={description?.trim() || undefined}
        eyebrow={eyebrow?.trim() || undefined}
        overlayAlignment={overlayAlignment ?? 'left'}
        overlayCoverage={overlayCoverage ?? 'full'}
        overlayDirection={overlayDirection ?? 'bottomToTop'}
        overlayStyle={overlayStyle ?? 'dark'}
        profiles={resolvedProfiles}
        size={size ?? 'default'}
        themeMode={themeMode ?? 'auto'}
        title={resolvedTitle}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}

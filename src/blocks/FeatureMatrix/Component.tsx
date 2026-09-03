import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import {
  FeatureMatrix,
  type FeatureMatrixAlignment,
  type FeatureMatrixImagePosition,
  type FeatureMatrixItem,
  type FeatureMatrixSize,
} from '@/components/feature-matrix'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'

type FeatureMatrixBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  borderAnimationEnabled?: boolean | null
  contentAlignment?: FeatureMatrixAlignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  features?:
    | {
        description?: string | null
        cardBackground?: string | null
        image?: unknown
        imagePosition?: FeatureMatrixImagePosition | null
        title?: string | null
      }[]
    | null
  showOuterBorder?: boolean | null
  size?: FeatureMatrixSize | null
  title?: string | null
}

export function FeatureMatrixBlockComponent({
  accentTitle,
  actions,
  appearance,
  borderAnimationEnabled = true,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  features,
  showOuterBorder = true,
  size = 'default',
  title,
}: FeatureMatrixBlockLike) {
  const resolvedFeatures = (features ?? []).flatMap((feature): FeatureMatrixItem[] => {
    const featureTitle = feature.title?.trim()
    const image = getMediaImageProps({
      fallbackAlt: featureTitle,
      media: feature.image as never,
      preset: 'generic',
    })

    return featureTitle && image
      ? [
          {
            description: feature.description,
            cardBackground: feature.cardBackground,
            image,
            imagePosition: feature.imagePosition,
            title: featureTitle,
          },
        ]
      : []
  })
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAlignment = contentAlignment ?? 'center'

  return (
    <>
      <FeatureMatrix
        accentTitle={accentTitle}
        actions={
          <ContentActions
            actions={resolvedActions}
            alignment={resolvedAlignment}
            data-feature-matrix-actions="true"
          />
        }
        alignment={resolvedAlignment}
        appearance={appearance}
        borderAnimationEnabled={borderAnimationEnabled ?? true}
        description={description}
        eyebrow={eyebrow}
        features={resolvedFeatures}
        showOuterBorder={showOuterBorder ?? true}
        size={size ?? 'default'}
        title={title}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}

import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type AspectRatio = '16/9' | '4/3' | '1/1' | '9/16'
type MaxWidth = 'full' | 'lg' | 'md'
type ContentAlignment = 'center' | 'left' | 'right'

type VideoEmbedBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  aspectRatio?: AspectRatio | null
  autoplay?: boolean | null
  caption?: string | null
  contentAlignment?: ContentAlignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  maxWidth?: MaxWidth | null
  size?: RegularBlockSize | null
  title?: string | null
  url?: string | null
}

const aspectRatioClasses: Record<AspectRatio, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '9/16': 'aspect-[9/16]',
}

const maxWidthClasses: Record<MaxWidth, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  full: 'max-w-none',
}

function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } {
  // YouTube — handles youtu.be, youtube.com/watch, youtube.com/shorts
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/,
  )
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    }
  }

  // Vimeo — handles vimeo.com/<id> and player.vimeo.com/video/<id>
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/)
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    }
  }

  return { type: 'direct', embedUrl: url }
}

const alignmentClasses: Record<ContentAlignment, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

export function VideoEmbedBlockComponent({
  actions,
  appearance,
  aspectRatio = '16/9',
  autoplay = false,
  caption,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  maxWidth = 'lg',
  size = 'default',
  title,
  url,
}: VideoEmbedBlockLike) {
  if (!url?.trim()) return null

  const resolvedSize: RegularBlockSize = size ?? 'default'
  const resolvedAspectRatio: AspectRatio = aspectRatio ?? '16/9'
  const resolvedMaxWidth: MaxWidth = maxWidth ?? 'lg'
  const resolvedAlignment: ContentAlignment = contentAlignment ?? 'center'
  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const { type, embedUrl } = parseVideoUrl(url.trim())

  const resolvedTitle = title?.trim()
  const iframeTitle = resolvedTitle || (type === 'youtube' ? 'YouTube video' : type === 'vimeo' ? 'Vimeo video' : 'Video')
  const autoplayParam = autoplay ? '&autoplay=1&mute=1' : ''
  const resolvedActions = resolveCmsActions(actions)

  const embedSrc =
    type === 'youtube'
      ? `${embedUrl}?rel=0&modestbranding=1${autoplayParam}`
      : type === 'vimeo'
        ? `${embedUrl}?dnt=1${autoplay ? '&autoplay=1&muted=1' : ''}`
        : embedUrl

  const hasHeader = resolvedTitle || eyebrow?.trim() || description?.trim() || resolvedActions.length > 0

  return (
    <section className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}>
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-8')}>
        {hasHeader ? (
          <header className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[resolvedAlignment], resolvedAlignment === 'center' && 'mx-auto', resolvedAlignment === 'right' && 'ml-auto')}>
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow.trim()}
              </SectionEyebrow>
            ) : null}
            {resolvedTitle ? (
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {resolvedTitle}
              </h2>
            ) : null}
            {description?.trim() ? (
              <p className="text-base leading-7 text-current/70">{description.trim()}</p>
            ) : null}
            {resolvedActions.length > 0 ? (
              <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
            ) : null}
          </header>
        ) : null}

        <figure className={cn('mx-auto w-full', maxWidthClasses[resolvedMaxWidth])}>
          <div className={cn('w-full overflow-hidden rounded-card', aspectRatioClasses[resolvedAspectRatio])}>
            {type === 'direct' ? (
              <video
                className="h-full w-full object-cover"
                controls
                autoPlay={autoplay ?? false}
                muted={autoplay ?? false}
                playsInline
                title={iframeTitle}
              >
                <source src={embedSrc} />
              </video>
            ) : (
              <iframe
                className="h-full w-full border-0"
                src={embedSrc}
                title={iframeTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
          {caption?.trim() ? (
            <figcaption className="mt-3 text-center text-sm text-current/70">
              {caption.trim()}
            </figcaption>
          ) : null}
        </figure>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}

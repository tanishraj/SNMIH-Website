import { Mail, MapPin, Phone } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { Button } from '@/components/ui/button'
import { ContentLink } from '@/components/ContentLink'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import { cn } from '@/lib/utils'

export type Contact24Size = 'none' | 'comfortable' | 'compact' | 'default'
export type Contact24Alignment = 'center' | 'left' | 'right'
export type Contact24DetailsAlignment = 'center' | 'left' | 'right'
export type Contact24MapActionMode = 'button' | 'link'
export type Contact24MapActionVariant = CmsActionVariant

export type Contact24Props = {
  actions?: React.ReactNode
  appearance?: BlockAppearance | null
  className?: string
  contentAlignment?: Contact24Alignment
  description?: string | null
  detailsAlignment?: Contact24DetailsAlignment
  eyebrow?: string | null
  mapActionLabel?: string
  mapActionMode?: Contact24MapActionMode
  mapActionVariant?: Contact24MapActionVariant
  offices: SiteOfficeLocation[]
  showLocationDetails?: boolean
  size?: Contact24Size
  title?: string | null
}

const headerGapClasses = {
  none: 'gap-4',
  compact: 'gap-3',
  default: 'gap-4',
  comfortable: 'gap-5',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

const gridGapClasses = {
  none: 'gap-6',
  compact: 'gap-4',
  default: 'gap-6',
  comfortable: 'gap-8',
} as const

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const detailsAlignmentClasses = {
  left: {
    action: 'self-start',
    content: 'items-start text-left',
  },
  center: {
    action: 'self-center',
    content: 'items-center text-center',
  },
  right: {
    action: 'self-end',
    content: 'items-end text-right',
  },
} as const


export function Contact24({
  actions,
  appearance,
  className,
  contentAlignment = 'left',
  description,
  detailsAlignment = 'left',
  eyebrow,
  mapActionLabel = 'View on Map',
  mapActionMode = 'link',
  mapActionVariant = 'outline',
  offices,
  showLocationDetails = true,
  size = 'default',
  title,
}: Contact24Props) {
  const resolvedTitle = title?.trim()
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  if (!resolvedTitle || offices.length === 0) {
    return null
  }

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[size],
        appearanceClasses.className,
        className,
      )}
      data-contact24-background={appearance?.background ?? 'none'}
      data-contact24-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex flex-col', sectionGapClasses[size])}>
          <header
            className={cn(
              'flex max-w-3xl flex-col',
              headerGapClasses[size],
              alignmentClasses[contentAlignment],
              contentAlignment === 'center' && 'mx-auto',
              contentAlignment === 'right' && 'ml-auto',
            )}
            data-contact24-content-alignment={contentAlignment}
          >
            {eyebrow ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow}
              </SectionEyebrow>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {resolvedTitle}
            </h2>
            {description ? (
              <p className="text-base leading-7 text-current/70">{description}</p>
            ) : null}
            {actions ? <div className="mt-2">{actions}</div> : null}
          </header>

          <div
            className={cn(
              'grid grid-cols-1',
              offices.length > 1 && 'md:grid-cols-2',
              gridGapClasses[size],
            )}
            data-contact24-office-count={offices.length}
          >
            {offices.map((office) => (
              <article
                className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border"
                data-contact24-office
                data-contact24-location-details={showLocationDetails ? 'visible' : 'hidden'}
                key={office.id}
              >
                <div
                  className="relative aspect-video w-full overflow-hidden sm:aspect-5/2"
                  data-contact24-map
                >
                  <iframe
                    allowFullScreen
                    className="size-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={office.mapEmbedUrl}
                    title={office.mapTitle ?? ''}
                  />
                </div>

                {showLocationDetails && office.showAddressDetails ? (
                  <div
                    className="flex flex-1 flex-col border-t border-border p-6 sm:p-8"
                    data-contact24-details
                    data-contact24-details-alignment={detailsAlignment}
                  >

                    {(office.region || office.city) && (
                      <div
                        className={cn(
                          'flex flex-col gap-2',
                          detailsAlignmentClasses[detailsAlignment].content,
                        )}
                      >
                        {office.region && (
                          <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-current/70">
                            {office.region}
                          </p>
                        )}
                        {office.city && (
                          <h3 className="text-2xl font-semibold tracking-tight">
                            {office.city}
                          </h3>
                        )}
                      </div>
                    )}

                    <address
                      className={cn(
                        'mt-6 flex w-full flex-col gap-3 not-italic',
                        detailsAlignmentClasses[detailsAlignment].content,
                      )}
                    >
                      {office.address && (
                        <div className="flex max-w-full min-w-0 items-start gap-3">
                          <MapPin
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-current/70"
                          />
                          <span>{office.address}</span>
                        </div>
                      )}
                      {office.phone && office.phoneHref && (
                        <a
                          className="flex max-w-full min-w-0 items-center gap-3 hover:underline"
                          href={office.phoneHref}
                        >
                          <Phone
                            aria-hidden="true"
                            className="size-4 shrink-0 text-current/70"
                          />
                          {office.phone}
                        </a>
                      )}
                      {office.email && (
                        <a
                          className="flex max-w-full min-w-0 items-center gap-3 break-all hover:underline"
                          href={`mailto:${office.email}`}
                        >
                          <Mail
                            aria-hidden="true"
                            className="size-4 shrink-0 text-current/70"
                          />
                          {office.email}
                        </a>
                      )}
                    </address>

                    <div
                      className={cn(
                        'mt-auto pt-6',
                        detailsAlignmentClasses[detailsAlignment].action,
                      )}
                    >
                      {mapActionMode === 'button' ? (
                        <Button asChild size="lg" variant={mapActionVariant}>
                          <a href={office.mapUrl} rel="noreferrer" target="_blank">
                            {mapActionLabel}
                          </a>
                        </Button>
                      ) : (
                        <ContentLink
                          href={office.mapUrl}
                          label={mapActionLabel}
                          openInNewTab
                        />
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

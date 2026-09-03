import type { Footer56Block as Footer56BlockType } from '@/payload-types'

import { getMediaImageProps } from '@/lib/media'
import { resolveCmsActions } from '@/lib/cmsLinks'
import { resolveHeaderLink } from '@/lib/headerNavigation'
import { Footer56 } from '@/components/footer56'
import { type LogoMediaLike } from '@/components/site/SiteLogo'
import {
  resolveSiteSocialLinks,
  type SiteSocialLinks,
} from '@/blocks/shared/siteSocialLinks'

type FooterSection = {
  title: string
  links: {
    name: string
    href: string
  }[]
}

type Footer56BlockComponentProps = Footer56BlockType & {
  siteAddress?: string | null
  siteEmail?: string | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
  sitePhone?: string | null
  privacyPolicyUrl?: string | null
  termsAndConditionsUrl?: string | null
  siteSocialLinks?: SiteSocialLinks
  socialIconStyle?: 'plain' | 'tile' | null
  socialPlacement?: 'bottomBar' | 'brand' | null
}

const resolveSections = (
  linkGroups?: Footer56BlockType['linkGroups'] | null,
) => {
  return (linkGroups ?? [])
    .map((group) => {
      const links = (group.links ?? [])
        .map((link) => resolveHeaderLink(link))
        .map((resolved) => (resolved ? { name: resolved.label, href: resolved.href } : null))
        .filter((link): link is { name: string; href: string } => Boolean(link))

      if (!group.title?.trim() || links.length === 0) {
        return null
      }

      return {
        title: group.title,
        links,
      }
    })
    .filter((group): group is FooterSection => group !== null)
}

const resolveLegalLinks = (
  bottomLinks?: Footer56BlockType['bottomLinks'],
  privacyPolicyUrl?: string | null,
  termsAndConditionsUrl?: string | null,
) => {
  const resolvedBottomLinks = (bottomLinks ?? [])
    .map((link) => resolveHeaderLink(link))
    .filter((link): link is NonNullable<ReturnType<typeof resolveHeaderLink>> => Boolean(link))
    .map((link) => ({ name: link.label, href: link.href }))

  const linkedHrefs = new Set(resolvedBottomLinks.map((link) => link.href))

  const legalPageLinks = (
    [
      [termsAndConditionsUrl, 'Terms & Conditions'],
      [privacyPolicyUrl, 'Privacy Policy'],
    ] as const
  ).flatMap(([href, name]) => {
    if (!href || linkedHrefs.has(href)) {
      return []
    }

    linkedHrefs.add(href)

    return [{ href, name }]
  })

  return [...resolvedBottomLinks, ...legalPageLinks]
}

export function Footer56BlockComponent({
  bottomLinks,
  copyrightText,
  ctaButtons,
  customLogoDark,
  customLogoLight,
  description,
  linkGroups,
  appearance,
  logoHeight,
  logoMode = 'siteDefault',
  privacyPolicyUrl,
  siteAddress,
  siteEmail,
  siteLogo,
  siteName,
  sitePhone,
  size,
  termsAndConditionsUrl,
  siteSocialLinks,
  socialIconStyle,
  socialPlacement,
}: Footer56BlockComponentProps) {
  const resolvedSiteName = siteName?.trim() || 'Shadcnblocks.com'
  const fallbackLogoHref = logoMode === 'customLogo' ? '/' : '/'
  const resolvedLogoHeight = typeof logoHeight === 'number' ? logoHeight : 28

  const resolvedLogo = (() => {
    const media = logoMode === 'customLogo' ? (customLogoLight ?? customLogoDark) : siteLogo

    const mediaProps = getMediaImageProps({
      media: media as never,
      preset: 'logo',
      fallbackAlt: siteName ?? 'Logo',
    })

    if (!mediaProps) {
      return undefined
    }

      return {
        alt: mediaProps.alt,
        src: mediaProps.src,
        title: resolvedSiteName,
        url: fallbackLogoHref,
        width: mediaProps.width,
        height: resolvedLogoHeight,
      }
    })()

  return (
    <Footer56
      // `ctaButtons` is a bespoke link array with no per-row display mode, and
      // these are buttons by definition, so force the mode here.
      actions={resolveCmsActions(ctaButtons, 'button')}
      addressLines={siteAddress?.split('\n').map((line) => line.trim()).filter(Boolean)}
      copyright={copyrightText ?? undefined}
      description={description ?? undefined}
      legalLinks={resolveLegalLinks(
        bottomLinks,
        privacyPolicyUrl,
        termsAndConditionsUrl,
      )}
      appearance={appearance}
      phone={sitePhone ?? undefined}
      email={siteEmail ?? undefined}
      size={size ?? 'default'}
      sections={resolveSections(linkGroups)}
      socialIconStyle={socialIconStyle ?? 'plain'}
      socialLinks={resolveSiteSocialLinks(siteSocialLinks)}
      socialPlacement={socialPlacement ?? 'brand'}
      logo={
        resolvedLogo ?? {
          alt: resolvedSiteName,
          src: '/images/logo/shadcnblocks-logo-word.svg',
          title: resolvedSiteName,
          url: '/',
          width: 192,
          height: resolvedLogoHeight,
        }
      }
    />
  )
}

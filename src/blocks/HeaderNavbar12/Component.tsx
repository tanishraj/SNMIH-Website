import Link from 'next/link'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { HeaderNavbar } from '@/components/header/HeaderNavbar'
import { SiteLogo, type LogoMediaLike } from '@/components/site/SiteLogo'
import { resolveHeaderLink, resolveHeaderMenuItems } from '@/lib/headerNavigation'
import type { HeaderNavbar12Block as HeaderNavbar12BlockType } from '@/payload-types'

type HeaderNavbar12BlockComponentProps = HeaderNavbar12BlockType & {
  appearance?: BlockAppearance | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
}

const logoHeightBySize = {
  compact: 56,
  default: 64,
  large: 80,
} as const

export function HeaderNavbar12BlockComponent({
  appearance,
  ctaButtons,
  customLogoDark,
  customLogoLight,
  logoHeight,
  logoMode,
  menuItems,
  navAlignment,
  siteLogo,
  siteName,
  size,
}: HeaderNavbar12BlockComponentProps) {
  const resolvedSize = size ?? 'default'
  const resolvedMenuItems = resolveHeaderMenuItems(menuItems)
  const resolvedCtas = (ctaButtons ?? [])
    .map((item) => {
      const link = resolveHeaderLink(item)

      if (!link) {
        return null
      }

      return {
        ...link,
        showArrow: Boolean(item.showArrow),
        variant: item.variant ?? 'default',
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const logo = (
    <Link
      aria-label={`Go to ${siteName?.trim() || 'home page'}`}
      className="inline-flex items-center"
      href="/"
    >
      <SiteLogo
        customDark={customLogoDark}
        customLight={customLogoLight}
        fallbackText={siteName?.trim() || 'Site'}
        height={logoHeight ?? logoHeightBySize[resolvedSize]}
        mode={logoMode ?? 'siteDefault'}
        siteLogo={siteLogo}
      />
    </Link>
  )

  return (
    <HeaderNavbar
      appearance={appearance}
      ctas={resolvedCtas}
      logo={logo}
      menuItems={resolvedMenuItems}
      navAlignment={navAlignment ?? 'center'}
      size={resolvedSize}
    />
  )
}

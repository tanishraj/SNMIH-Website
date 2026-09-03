import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'

/** Shape of the `socialLinks` group on the Site Settings global. */
export type SiteSocialLinks = {
  facebook?: string | null
  instagram?: string | null
  linkedin?: string | null
  x?: string | null
  youtube?: string | null
} | null

export type ResolvedSocialLink = {
  Icon: IconType
  href: string
  label: string
  platform: SiteSocialPlatform
}

// Declaration order is render order, so the icon row reads the same everywhere.
const socialPlatforms = {
  facebook: { label: 'Facebook', Icon: FaFacebookF },
  instagram: { label: 'Instagram', Icon: FaInstagram },
  x: { label: 'X', Icon: FaXTwitter },
  youtube: { label: 'YouTube', Icon: FaYoutube },
  linkedin: { label: 'LinkedIn', Icon: FaLinkedinIn },
} as const

export type SiteSocialPlatform = keyof typeof socialPlatforms

/**
 * Turns the Site Settings social group into a render-ready list, dropping any
 * platform left blank. Iterating the platform map rather than the stored object
 * keeps the order stable no matter what order the values were saved in.
 */
export const resolveSiteSocialLinks = (links?: SiteSocialLinks): ResolvedSocialLink[] =>
  (Object.keys(socialPlatforms) as SiteSocialPlatform[]).flatMap((platform) => {
    const href = links?.[platform]?.trim()

    if (!href) {
      return []
    }

    return [{ ...socialPlatforms[platform], href, platform }]
  })

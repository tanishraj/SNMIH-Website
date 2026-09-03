import { renderFooterBlocks } from '@/blocks/renderFooterBlocks'
import type { LogoMediaLike } from '@/components/site/SiteLogo'
import type { Footer } from '@/payload-types'
import type { SiteSocialLinks } from '@/blocks/shared/siteSocialLinks'

type GlobalFooterProps = {
  footer?: Pick<Footer, 'layout'> | null
  privacyPolicyUrl?: string | null
  termsAndConditionsUrl?: string | null
  siteAddress?: string | null
  siteEmail?: string | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
  sitePhone?: string | null
  siteSocialLinks?: SiteSocialLinks
}

export function GlobalFooter({
  footer,
  privacyPolicyUrl,
  termsAndConditionsUrl,
  siteAddress,
  siteEmail,
  siteLogo,
  siteName,
  sitePhone,
  siteSocialLinks,
}: GlobalFooterProps) {
  if (!footer?.layout?.length) {
    return null
  }

  return (
    <div data-global-footer="true">
      {renderFooterBlocks(footer.layout, {
        privacyPolicyUrl,
        termsAndConditionsUrl,
        siteAddress,
        siteEmail,
        siteLogo,
        siteName,
        sitePhone,
        siteSocialLinks,
      })}
    </div>
  )
}

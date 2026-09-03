import Image from 'next/image'

import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { Mail, MapPin, Phone } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { ContentActions } from '@/components/ContentActions'
import { sectionEyebrowClasses, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import type { ResolvedCmsAction } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

interface FooterLink {
  name: string
  href: string
}
interface FooterSection {
  title?: string | null
  links: FooterLink[]
}
interface FooterSocialLink {
  Icon: IconType
  href: string
  label: string
  platform?: string
}
interface FooterLogo {
  url: string
  src: string
  alt: string
  title?: string | null
  width?: number
  height?: number
}

interface FooterBasicProps {
  actions?: ResolvedCmsAction[]
  logo?: FooterLogo
  sections?: FooterSection[]
  socialLinks?: FooterSocialLink[]
  copyright?: string
  description?: string
  legalLinks?: FooterLink[]
  appearance?: BlockAppearance | null
  className?: string
  size?: RegularBlockSize | null
}

interface Footer56Props extends FooterBasicProps {
  addressLines?: string[]
  phone?: string
  email?: string
  socialIconStyle?: 'plain' | 'tile'
  socialPlacement?: 'bottomBar' | 'brand'
}
type Props = Partial<Footer56Props>

const defaultProps: Footer56Props = {
  logo: {
    url: 'https://www.shadcnblocks.com',
    src: '/images/logo/shadcnblocks-logo-word.svg',
    alt: 'logo',
    title: 'Shadcnblocks.com',
  },
  sections: [
    {
      title: 'Product',
      links: [
        { name: 'Overview', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'Marketplace', href: '#' },
        { name: 'Features', href: '#' },
        { name: 'Integrations', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#' },
        { name: 'Team', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help center', href: '#' },
        { name: 'Documentation', href: '#' },
        { name: 'Status', href: '#' },
        { name: 'Community', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Guides', href: '#' },
        { name: 'Templates', href: '#' },
        { name: 'Sales', href: '#' },
        { name: 'Advertise', href: '#' },
      ],
    },
  ],
  socialLinks: [
    { Icon: FaFacebookF, href: '#', label: 'Facebook' },
    { Icon: FaInstagram, href: '#', label: 'Instagram' },
    { Icon: FaXTwitter, href: '#', label: 'X' },
    { Icon: FaYoutube, href: '#', label: 'YouTube' },
    { Icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
  ],
  copyright: '© 2024 Shadcnblocks.com. All rights reserved.',
  legalLinks: [
    { name: 'Terms & Conditions', href: '#' },
    { name: 'Privacy Policy', href: '#' },
  ],
  addressLines: ['123 Market Street, Suite 400', 'San Francisco, CA 94103'],
  phone: '+1 (555) 000-0000',
  email: 'hello@shadcnblocks.com',
}

const MAX_SECTIONS = 4

const Footer56 = (props: Props) => {
  const {
    actions,
    appearance,
    logo,
    addressLines,
    phone,
    email,
    sections,
    size,
    socialIconStyle,
    socialLinks,
    socialPlacement,
    copyright,
    description,
    legalLinks,
    className,
  } = {
    ...defaultProps,
    ...props,
  }

  const visibleSections = (sections ?? []).slice(0, MAX_SECTIONS)
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const eyebrowSurface: SectionEyebrowSurface = appearanceClasses.background
  const footerLinkClasses = 'text-current/70 transition-colors hover:text-current'

  // Tiles tint from currentColor so they stay legible on a light surface and on
  // the navy brand surface alike, without branching on which one is in use.
  const socialList = socialLinks?.length ? (
    <ul className="flex flex-wrap items-center gap-3" data-footer56-social="true">
      {socialLinks.map(({ Icon, href, label, platform }, idx) => (
        <li key={platform ?? `${label}-${idx}`}>
          <a
            aria-label={label}
            className={cn(
              'inline-flex items-center justify-center transition-colors',
              socialIconStyle === 'tile'
                ? 'size-10 rounded-control bg-current/10 text-current hover:bg-current/20'
                : footerLinkClasses,
            )}
            data-footer56-social-link={platform ?? label}
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            <Icon className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  ) : null

  // Fixed order — social, copyright, legal — so two slots fall to the correct
  // sides and a lone slot centres, with no per-combination special casing.
  const bottomBarSlots = [
    socialPlacement === 'bottomBar' && socialList ? { key: 'social', node: socialList } : null,
    copyright ? { key: 'copyright', node: <p className="text-current/70">{copyright}</p> } : null,
    legalLinks?.length
      ? {
          key: 'legal',
          node: (
            <ul className="flex flex-wrap justify-center gap-4">
              {legalLinks.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <a className={cn('underline', footerLinkClasses)} href={link.href}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          ),
        }
      : null,
  ].flatMap((slot) => (slot ? [slot] : []))
  const sectionClassName = cn(
    regularBlockMobilePaddingClasses[size ?? 'default'],
    appearanceClasses.className,
    className,
  )

  return (
    <section
      className={sectionClassName}
      data-footer56-background={appearance?.background ?? 'none'}
    >
      <div className={cn(regularBlockContainerClasses, 'flex')}>
        <footer className="w-full">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center lg:justify-start">
                <a href={logo?.url ?? '#'}>
                  <Image
                    src={logo?.src ?? ''}
                    alt={logo?.alt ?? ''}
                    title={logo?.title ?? ''}
                    width={logo?.width ?? 120}
                    height={Math.max(logo?.height ?? 28, 1)}
                    style={{
                      width: 'auto',
                      height: `${logo?.height ?? 28}px`,
                      objectFit: 'contain',
                    }}
                    className="h-auto w-auto dark:invert"
                  />
                </a>
              </div>
              {description ? (
                <p className="mt-6 max-w-sm text-sm leading-6 text-current/70">{description}</p>
              ) : null}
              {actions?.length ? <ContentActions actions={actions} className="mt-6" /> : null}
              <div className="mt-6 space-y-3 text-sm text-current/70">
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-current/70" aria-hidden />
                  <div className="space-y-0.5">
                    {(addressLines ?? []).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
                {phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" aria-hidden />
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                      className={cn('font-medium', footerLinkClasses)}
                    >
                      {phone}
                    </a>
                  </div>
                ) : null}
                {email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" aria-hidden />
                    <a href={`mailto:${email}`} className={cn('font-medium', footerLinkClasses)}>
                      {email}
                    </a>
                  </div>
                ) : null}
              </div>
              {socialPlacement !== 'bottomBar' ? <div className="mt-6">{socialList}</div> : null}
            </div>
            {visibleSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className={sectionEyebrowClasses} data-section-eyebrow-surface={eyebrowSurface}>
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-4 text-sm">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a className={cn('font-medium', footerLinkClasses)} href={link.href}>
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {bottomBarSlots.length > 0 ? (
            <div
              className={cn(
                'mt-8 flex flex-col items-center gap-4 border-t border-current/15 pt-8 text-xs font-medium',
                // Real thirds, so the middle slot is centred whatever the
                // outer two weigh; justify-between would only approximate it.
                bottomBarSlots.length === 3 && 'md:grid md:grid-cols-3 md:items-center',
                bottomBarSlots.length === 2 && 'md:flex-row md:items-center md:justify-between',
                bottomBarSlots.length === 1 && 'md:flex-row md:justify-center',
              )}
              data-footer56-bottom-bar="true"
              data-footer56-bottom-slots={bottomBarSlots.length}
            >
              {bottomBarSlots.map((slot, index) => (
                <div
                  className={cn(
                    'flex items-center',
                    bottomBarSlots.length === 3 &&
                      ['md:justify-self-start', 'md:justify-self-center', 'md:justify-self-end'][
                        index
                      ],
                  )}
                  key={slot.key}
                >
                  {slot.node}
                </div>
              ))}
            </div>
          ) : null}
        </footer>
      </div>
    </section>
  )
}

export { Footer56 }

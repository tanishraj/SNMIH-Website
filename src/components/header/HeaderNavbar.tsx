import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import { HeaderMobileMenu } from '@/components/header/HeaderMobileMenu'
import { HeaderNavMenu } from '@/components/header/HeaderNavMenu'
import { SearchTriggerButton } from '@/components/header/SearchTriggerButton'
import { Button } from '@/components/ui/button'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import type { ResolvedHeaderLink, ResolvedHeaderMenuItem } from '@/lib/headerNavigation'
import { cn } from '@/lib/utils'

type HeaderNavbarProps = {
  appearance?: BlockAppearance | null
  ctas: Array<
    ResolvedHeaderLink & {
      showArrow?: boolean
      variant?: CmsActionVariant | null
    }
  >
  logo: ReactNode
  menuItems: ResolvedHeaderMenuItem[]
  navAlignment: 'left' | 'center' | 'right'
  size: 'compact' | 'default' | 'large'
}

const sizeClasses = {
  compact: 'min-h-14',
  default: 'min-h-16',
  large: 'min-h-20',
} as const

const navAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

const ctaButtonSizes = {
  compact: 'sm',
  default: 'default',
  large: 'lg',
} as const

export function HeaderNavbar({
  appearance,
  ctas,
  logo,
  menuItems,
  navAlignment,
  size,
}: HeaderNavbarProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const usesDefaultSurface = (appearance?.background ?? 'none') === 'none'

  return (
    <header
      className={cn(
        'shadow-sm backdrop-blur-lg',
        usesDefaultSurface &&
          'bg-background/80 text-foreground supports-backdrop-filter:bg-background/70',
        appearanceClasses.className,
      )}
      data-header-navbar-background={appearance?.background ?? 'none'}
      data-header-navbar-style="navbar12"
      data-header-navbar="true"
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-8 px-4',
          sizeClasses[size],
        )}
      >
        <div className="flex max-h-full shrink-0 items-center self-stretch">{logo}</div>

        <div className={cn('hidden min-w-0 flex-1 lg:flex', navAlignmentClasses[navAlignment])}>
          <HeaderNavMenu menuItems={menuItems} size={size} />
        </div>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          <SearchTriggerButton size={size} />
          {ctas.map((item) =>
            item.variant === 'link' ? (
              <ContentLink
                href={item.href}
                key={`${item.label}-${item.href}`}
                label={item.label}
                openInNewTab={item.newTab}
              />
            ) : (
              <Button
                asChild
                key={`${item.label}-${item.href}`}
                size={ctaButtonSizes[size]}
                variant={item.variant ?? 'default'}
              >
                <a
                  href={item.href}
                  rel={item.newTab ? 'noreferrer' : undefined}
                  target={item.newTab ? '_blank' : undefined}
                >
                  <ActionButtonContent label={item.label} showArrow={item.showArrow} />
                </a>
              </Button>
            ),
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <SearchTriggerButton size="compact" />
          <HeaderMobileMenu ctas={ctas} menuItems={menuItems} />
        </div>
      </div>
    </header>
  )
}

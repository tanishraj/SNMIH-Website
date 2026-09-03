import type { Header } from '@/payload-types'
import type { LogoMediaLike } from '@/components/site/SiteLogo'

import { HeaderNavbar12BlockComponent } from './HeaderNavbar12/Component'

export type HeaderBlock = NonNullable<Header['layout']>[number]

export function renderHeaderBlocks(
  blocks?: HeaderBlock[] | null,
  context?: { siteLogo?: LogoMediaLike; siteName?: string | null },
) {
  if (!blocks?.length) {
    return null
  }

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case 'headerNavbar12':
            return (
              <HeaderNavbar12BlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                siteLogo={context?.siteLogo}
                siteName={context?.siteName}
                {...block}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

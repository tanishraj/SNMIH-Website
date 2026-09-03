import { renderHeaderBlocks } from '@/blocks/renderHeaderBlocks'
import type { LogoMediaLike } from '@/components/site/SiteLogo'
import type { Header } from '@/payload-types'

type GlobalHeaderProps = {
  header?: Pick<Header, 'layout'> | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
  stickyTopOffset?: string
}

export function GlobalHeader({
  header,
  siteLogo,
  siteName,
  stickyTopOffset = '0px',
}: GlobalHeaderProps) {
  if (!header?.layout?.length) {
    return null
  }

  const firstBlock = header.layout[0]
  const isSticky = firstBlock.blockType !== 'headerNavbar12' || firstBlock.sticky !== false

  return (
    <div
      data-global-header="true"
      data-global-header-sticky={isSticky ? 'true' : 'false'}
      style={
        isSticky
          ? {
              position: 'sticky',
              top: stickyTopOffset,
              zIndex: 30,
            }
          : undefined
      }
    >
      {renderHeaderBlocks(header.layout, { siteLogo, siteName })}
    </div>
  )
}

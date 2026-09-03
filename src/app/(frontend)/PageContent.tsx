import { getRenderableBlocks, RenderBlocks } from '@/blocks/RenderBlocks'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import type { Page, SystemPage } from '@/payload-types'

export function PageContent({
  isHomepage = false,
  page,
}: {
  isHomepage?: boolean
  page: Page | SystemPage
}) {
  if ('type' in page) {
    return (
      <div data-system-page-root="true">
        <RenderBlocks blocks={getRenderableBlocks(page)} />
      </div>
    )
  }

  return renderPageBlocks(page.layout, { isHomepage, page })
}

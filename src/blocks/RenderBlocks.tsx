import type { SystemPage } from '@/payload-types'

import { PageBlockStack } from './PageBlockStack'
import { System404BlockComponent } from './System404/Component'
import { SystemComingSoonBlockComponent } from './SystemComingSoon/Component'
import { SystemMaintenanceBlockComponent } from './SystemMaintenance/Component'

type RenderableBlock = NonNullable<SystemPage['layout']>[number]

export function getRenderableBlocks(document: SystemPage): RenderableBlock[] | null {
  return document.layout ?? null
}

export function RenderBlocks({ blocks }: { blocks?: RenderableBlock[] | null }) {
  if (!blocks?.length) {
    return null
  }

  return (
    <PageBlockStack>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case 'system404':
            return (
              <System404BlockComponent key={block.id ?? `${block.blockType}-${index}`} {...block} />
            )
          case 'systemMaintenance':
            return (
              <SystemMaintenanceBlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                {...block}
              />
            )
          case 'systemComingSoon':
            return (
              <SystemComingSoonBlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                {...block}
              />
            )
          default:
            return null
        }
      })}
    </PageBlockStack>
  )
}

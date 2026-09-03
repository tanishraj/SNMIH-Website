import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { longFormRichTextClasses } from '@/components/rich-text/richTextStyles'
import { cn } from '@/lib/utils'

type MaxWidth = 'full' | 'lg' | 'md' | 'prose'

type RichTextBlockLike = {
  appearance?: BlockAppearance | null
  content?: SerializedEditorState | null
  maxWidth?: MaxWidth | null
  size?: RegularBlockSize | null
}

const maxWidthClasses: Record<MaxWidth, string> = {
  prose: 'max-w-prose',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  full: 'max-w-none',
}

export function RichTextBlockComponent({
  appearance,
  content,
  maxWidth = 'prose',
  size = 'default',
}: RichTextBlockLike) {
  if (!content) return null

  const resolvedSize: RegularBlockSize = size ?? 'default'
  const resolvedMaxWidth: MaxWidth = maxWidth ?? 'prose'
  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)

  return (
    <section className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}>
      <div className={regularBlockContainerClasses}>
        <div className={cn('mx-auto', maxWidthClasses[resolvedMaxWidth])}>
          <div className={longFormRichTextClasses}>
            <RichText data={content} />
          </div>
        </div>
      </div>
    </section>
  )
}

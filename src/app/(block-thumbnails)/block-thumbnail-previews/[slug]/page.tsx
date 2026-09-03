import { notFound } from 'next/navigation'

import { BlockThumbnailPreviewStage } from '@/block-thumbnails/BlockThumbnailPreviewStage'
import {
  getBlockThumbnailDefinition,
  isBlockThumbnailPreviewEnabled,
  isBlockThumbnailSlug,
} from '@/block-thumbnails/definitions'
import { getBlockThumbnailFixture } from '@/block-thumbnails/fixtures'

type BlockThumbnailPageProps = {
  params: Promise<{ slug: string }>
}

export default async function BlockThumbnailPage({ params }: BlockThumbnailPageProps) {
  if (!isBlockThumbnailPreviewEnabled(process.env.NODE_ENV)) {
    notFound()
  }

  const { slug } = await params

  if (!isBlockThumbnailSlug(slug)) {
    notFound()
  }

  const definition = getBlockThumbnailDefinition(slug)

  return (
    <BlockThumbnailPreviewStage alignment={definition.stageAlignment} label={definition.label}>
      {getBlockThumbnailFixture(slug)}
    </BlockThumbnailPreviewStage>
  )
}

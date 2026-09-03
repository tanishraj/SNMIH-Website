import {
  ImageMosaicBlockPresentation,
  type ImageMosaicBlockLike,
} from '@/blocks/ImageMosaic/Presentation'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

export function ImageMosaicPreviewBlockComponent({
  albums,
  ...block
}: ImageMosaicBlockLike & { albums: EventGalleryAlbum[] }) {
  return <ImageMosaicBlockPresentation {...block} albums={albums} />
}

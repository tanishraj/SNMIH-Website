import {
  ImageMosaicBlockPresentation,
  type ImageMosaicBlockLike,
} from '@/blocks/ImageMosaic/Presentation'
import { normalizeImageMosaicContentSource } from '@/components/image-mosaic-presentation'
import { getPublishedEventGalleryAlbums } from '@/lib/eventGallery'
import { getEventGalleryAlbumRelationshipIDs } from '@/lib/eventGalleryShared'

export function ImageMosaicBlockComponent(props: ImageMosaicBlockLike) {
  const source = normalizeImageMosaicContentSource(props.contentSource)

  if (source === 'manualImages') {
    return <ImageMosaicBlockPresentation {...props} contentSource={source} />
  }

  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(props.galleryAlbums).slice(0, 8)
  if (!selectedAlbumIDs.length) return null

  return getPublishedEventGalleryAlbums(selectedAlbumIDs).then((albums) => (
    <ImageMosaicBlockPresentation {...props} albums={albums} contentSource={source} />
  ))
}

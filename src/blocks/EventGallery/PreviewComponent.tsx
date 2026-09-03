import {
  EventGalleryBlockPresentation,
  type EventGalleryBlockLike,
} from '@/blocks/EventGallery/Presentation'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
  type EventGalleryAlbum,
} from '@/lib/eventGalleryShared'

export function EventGalleryPreviewBlockComponent({
  albums,
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: EventGalleryBlockLike & { albums: EventGalleryAlbum[] }) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <EventGalleryBlockPresentation {...props} albums={selectedAlbums} />
}

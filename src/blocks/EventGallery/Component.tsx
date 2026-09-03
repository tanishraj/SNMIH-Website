import {
  EventGalleryBlockPresentation,
  type EventGalleryBlockLike,
} from '@/blocks/EventGallery/Presentation'
import { getPublishedEventGalleryAlbums } from '@/lib/eventGallery'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
} from '@/lib/eventGalleryShared'

export async function EventGalleryBlockComponent({
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: EventGalleryBlockLike) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)

  if (!selectedAlbumIDs.length) {
    return null
  }

  const albums = await getPublishedEventGalleryAlbums(selectedAlbumIDs)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <EventGalleryBlockPresentation {...props} albums={selectedAlbums} />
}

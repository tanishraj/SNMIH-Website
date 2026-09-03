import {
  GalleryAlbumTabsBlockPresentation,
  type GalleryAlbumTabsBlockLike,
} from '@/blocks/GalleryAlbumTabs/Presentation'
import { getPublishedEventGalleryAlbums } from '@/lib/eventGallery'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
} from '@/lib/eventGalleryShared'

export async function GalleryAlbumTabsBlockComponent({
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: GalleryAlbumTabsBlockLike) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const albums = selectedAlbumIDs.length
    ? await getPublishedEventGalleryAlbums(selectedAlbumIDs)
    : []
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <GalleryAlbumTabsBlockPresentation {...props} albums={selectedAlbums} />
}

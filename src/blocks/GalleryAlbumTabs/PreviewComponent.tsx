import {
  GalleryAlbumTabsBlockPresentation,
  type GalleryAlbumTabsBlockLike,
} from '@/blocks/GalleryAlbumTabs/Presentation'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
  type EventGalleryAlbum,
} from '@/lib/eventGalleryShared'

export function GalleryAlbumTabsPreviewBlockComponent({
  albums,
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: GalleryAlbumTabsBlockLike & { albums: EventGalleryAlbum[] }) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <GalleryAlbumTabsBlockPresentation {...props} albums={selectedAlbums} />
}

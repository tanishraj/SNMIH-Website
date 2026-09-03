# Event Gallery Focused Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Event Gallery viewer's default PhotoSwipe interface with the approved Focused Carousel overlay while preserving PhotoSwipe navigation, zoom, gestures, accessibility, and focus behavior.

**Architecture:** Keep `EventGalleryViewer` as the PhotoSwipe lifecycle adapter and mount a separate React overlay through PhotoSwipe's UI registration API. The overlay receives a small state-and-callback contract, renders all controls with Lucide icons, and derives captions and adjacent-image previews from the active album image.

**Tech Stack:** React 19, TypeScript, PhotoSwipe 5.4, Lucide React, Tailwind CSS 4, shadcn `Button`, Vitest, Testing Library

## Global Constraints

- Keep PhotoSwipe as the carousel engine; do not add another carousel dependency.
- Do not change Gallery Album fields, Event Gallery block fields, album selection, ordering, loading, cards, or live preview.
- Use a dark charcoal full-viewport stage, one centered contained image, desktop-only adjacent previews, and a compact floating thumbnail dock.
- Use Lucide React icons and the project's radius, border, spacing, focus-ring, and button conventions.
- Hide adjacent previews while zoomed, below the desktop breakpoint, and for single-image albums.
- Hide arrows and the thumbnail dock for single-image albums.
- Omit the caption region when neither an explicit caption nor useful alt text exists.
- Preserve swipe, vertical-drag dismissal, arrow keys, Escape, wheel/pinch/click zoom, body-scroll locking, and focus restoration.
- Honor reduced-motion preferences and do not add autoplay or ornamental motion.

---

## File Structure

- Create `src/components/event-gallery-viewer-overlay.tsx` — pure React presentation for viewer metadata, Lucide controls, adjacent previews, caption, and thumbnail dock.
- Modify `src/components/event-gallery-viewer.tsx` — PhotoSwipe lifecycle, UI mount, event-to-React state synchronization, and control callbacks.
- Modify `src/styles/custom.css` — scoped PhotoSwipe charcoal background and overlay-stage styling that cannot be expressed on PhotoSwipe-owned elements.
- Create `tests/int/event-gallery-viewer.int.spec.tsx` — overlay behavior and PhotoSwipe bridge integration.
- Modify `tests/int/event-gallery-render.int.spec.tsx` — retain its partial viewer mock and add a focus-restoration regression assertion.

### Task 1: Build the Focused Carousel overlay

**Files:**
- Create: `src/components/event-gallery-viewer-overlay.tsx`
- Create: `tests/int/event-gallery-viewer.int.spec.tsx`

**Interfaces:**
- Consumes: `EventGalleryAlbum` and `EventGalleryImage` from `@/lib/eventGalleryShared`.
- Produces:
  - `getEventGalleryCaption(image: EventGalleryImage, albumTitle: string): string | undefined`
  - `getAdjacentImageIndexes(length: number, currentIndex: number): { next: number; previous: number } | null`
  - `EventGalleryViewerOverlay(props: EventGalleryViewerOverlayProps): React.JSX.Element`
  - `EventGalleryViewerOverlayProps` with active state and navigation callbacks for Task 2.

- [ ] **Step 1: Write failing overlay tests**

Create `tests/int/event-gallery-viewer.int.spec.tsx` with the album fixture and overlay assertions:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  EventGalleryViewerOverlay,
  getAdjacentImageIndexes,
  getEventGalleryCaption,
} from '@/components/event-gallery-viewer-overlay'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const album: EventGalleryAlbum = {
  cover: {
    alt: 'Opening ceremony',
    height: 900,
    id: 'image-1',
    src: '/media/opening.jpg',
    width: 1600,
  },
  createdAt: '2026-07-26T00:00:00.000Z',
  id: 'album-1',
  imageCount: 3,
  images: [
    {
      alt: 'Opening ceremony',
      height: 900,
      id: 'image-1',
      src: '/media/opening.jpg',
      width: 1600,
    },
    {
      alt: 'Independence Day',
      caption: 'Students celebrate together',
      height: 900,
      id: 'image-2',
      src: '/media/celebration.jpg',
      width: 1600,
    },
    {
      alt: 'Closing performance',
      height: 900,
      id: 'image-3',
      src: '/media/performance.jpg',
      width: 1600,
    },
  ],
  title: 'Independence Day',
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(cleanup)

describe('EventGalleryViewerOverlay', () => {
  it('derives looped adjacent images and useful captions', () => {
    expect(getAdjacentImageIndexes(3, 0)).toEqual({ next: 1, previous: 2 })
    expect(getAdjacentImageIndexes(1, 0)).toBeNull()
    expect(getEventGalleryCaption(album.images[0]!, album.title)).toBe('Opening ceremony')
    expect(getEventGalleryCaption(album.images[1]!, album.title)).toBe(
      'Students celebrate together',
    )
    expect(
      getEventGalleryCaption(
        { ...album.images[0]!, alt: ' independence day ' },
        album.title,
      ),
    ).toBeUndefined()
  })

  it('renders metadata, side previews, controls, caption, and thumbnails', () => {
    const onClose = vi.fn()
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onSelect = vi.fn()
    const onToggleZoom = vi.fn()

    render(
      <EventGalleryViewerOverlay
        album={album}
        currentIndex={1}
        isZoomable
        isZoomed={false}
        onClose={onClose}
        onNext={onNext}
        onPrevious={onPrevious}
        onSelect={onSelect}
        onToggleZoom={onToggleZoom}
      />,
    )

    expect(screen.getByText('Independence Day')).toBeTruthy()
    expect(screen.getByText('02 / 03')).toBeTruthy()
    expect(screen.getByText('Students celebrate together')).toBeTruthy()
    expect(screen.getByTestId('event-gallery-preview-previous').getAttribute('src')).toBe(
      '/media/opening.jpg',
    )
    expect(screen.getByTestId('event-gallery-preview-next').getAttribute('src')).toBe(
      '/media/performance.jpg',
    )
    expect(
      screen.getByTestId('event-gallery-preview-next').parentElement?.className,
    ).toContain('hidden')
    expect(
      screen.getByTestId('event-gallery-preview-next').parentElement?.className,
    ).toContain('lg:block')
    expect(screen.getByRole('button', { name: 'View image 2 of 3' }).getAttribute('aria-current')).toBe(
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close gallery' }))
    fireEvent.click(screen.getByRole('button', { name: 'View image 3 of 3' }))

    expect(onPrevious).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
    expect(onToggleZoom).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(2)

    const brokenPreview = screen.getByTestId('event-gallery-preview-next')
    fireEvent.error(brokenPreview)
    expect(brokenPreview.parentElement?.hasAttribute('hidden')).toBe(true)
  })

  it('hides multi-image UI and repeated-title captions for one image', () => {
    render(
      <EventGalleryViewerOverlay
        album={{
          ...album,
          imageCount: 1,
          images: [{ ...album.images[0]!, alt: album.title }],
        }}
        currentIndex={0}
        isZoomable={false}
        isZoomed={false}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSelect={vi.fn()}
        onToggleZoom={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Previous image' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next image' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'View image 1 of 1' })).toBeNull()
    expect(screen.queryByTestId('event-gallery-caption')).toBeNull()
    expect(screen.getByRole('button', { name: 'Zoom in' }).hasAttribute('disabled')).toBe(true)
  })

  it('switches zoom semantics and hides previews while enlarged', () => {
    render(
      <EventGalleryViewerOverlay
        album={album}
        currentIndex={0}
        isZoomable
        isZoomed
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSelect={vi.fn()}
        onToggleZoom={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy()
    expect(screen.queryByTestId('event-gallery-preview-previous')).toBeNull()
    expect(screen.queryByTestId('event-gallery-preview-next')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the new test and confirm the missing-module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: FAIL because `@/components/event-gallery-viewer-overlay` does not exist.

- [ ] **Step 3: Implement the overlay and helper functions**

Create `src/components/event-gallery-viewer-overlay.tsx`:

```tsx
'use client'

import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import type {
  EventGalleryAlbum,
  EventGalleryImage,
} from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

export type EventGalleryViewerOverlayProps = {
  album: EventGalleryAlbum
  currentIndex: number
  isZoomable: boolean
  isZoomed: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  onSelect: (index: number) => void
  onToggleZoom: () => void
}

export const getEventGalleryCaption = (
  image: EventGalleryImage,
  albumTitle: string,
): string | undefined => {
  const caption = image.caption?.trim()

  if (caption) {
    return caption
  }

  const alt = image.alt.trim()

  if (!alt || alt.toLocaleLowerCase() === albumTitle.trim().toLocaleLowerCase()) {
    return undefined
  }

  return alt
}

export const getAdjacentImageIndexes = (
  length: number,
  currentIndex: number,
): { next: number; previous: number } | null => {
  if (length <= 1) {
    return null
  }

  return {
    next: (currentIndex + 1) % length,
    previous: (currentIndex - 1 + length) % length,
  }
}

const getCounter = (currentIndex: number, total: number) => {
  const width = Math.max(2, String(total).length)

  return `${String(currentIndex + 1).padStart(width, '0')} / ${String(total).padStart(width, '0')}`
}

export function EventGalleryViewerOverlay({
  album,
  currentIndex,
  isZoomable,
  isZoomed,
  onClose,
  onNext,
  onPrevious,
  onSelect,
  onToggleZoom,
}: EventGalleryViewerOverlayProps) {
  const activeThumbnailRef = useRef<HTMLButtonElement>(null)
  const currentImage = album.images[currentIndex]
  const adjacentIndexes = getAdjacentImageIndexes(album.images.length, currentIndex)
  const caption = currentImage
    ? getEventGalleryCaption(currentImage, album.title)
    : undefined

  useEffect(() => {
    activeThumbnailRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: 'center',
    })
  }, [currentIndex])

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 text-white"
      data-event-gallery-viewer-overlay="true"
    >
      {adjacentIndexes && !isZoomed ? (
        <>
          {(['previous', 'next'] as const).map((direction) => {
            const image = album.images[adjacentIndexes[direction]]

            return image ? (
              <div
                aria-hidden="true"
                className={cn(
                  'event-gallery-side-preview absolute top-1/2 hidden h-[46vh] w-24 -translate-y-1/2 overflow-hidden opacity-30 lg:block xl:w-28',
                  direction === 'previous' ? 'left-0' : 'right-0',
                )}
                key={`${direction}-${image.id}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="size-full object-cover"
                  data-testid={`event-gallery-preview-${direction}`}
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.parentElement?.setAttribute('hidden', '')
                  }}
                  src={image.src}
                />
              </div>
            ) : null
          })}
        </>
      ) : null}

      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="min-w-0 pt-1 text-shadow-sm">
          <p className="truncate text-xs font-semibold tracking-[0.14em] uppercase">
            {album.title}
          </p>
          <p className="mt-1 font-mono text-[11px] text-white/65">
            {getCounter(currentIndex, album.images.length)}
          </p>
        </div>

        <div className="pointer-events-auto flex shrink-0 gap-2">
          <Button
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            className="size-11 border-white/20 bg-black/25 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
            disabled={!isZoomable}
            onClick={onToggleZoom}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            {isZoomed ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <Button
            aria-label="Close gallery"
            className="size-11 border-white/20 bg-black/25 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
            onClick={onClose}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <X />
          </Button>
        </div>
      </header>

      {adjacentIndexes ? (
        <>
          <Button
            aria-label="Previous image"
            className="pointer-events-auto absolute top-1/2 left-3 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/35 text-white backdrop-blur-md hover:bg-white/15 hover:text-white sm:left-5"
            onClick={onPrevious}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Next image"
            className="pointer-events-auto absolute top-1/2 right-3 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/35 text-white backdrop-blur-md hover:bg-white/15 hover:text-white sm:right-5"
            onClick={onNext}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <ChevronRight />
          </Button>
        </>
      ) : null}

      <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-3 sm:inset-x-6 sm:bottom-5">
        {caption ? (
          <p
            className="max-w-2xl text-center text-xs leading-5 text-white/85 text-shadow-sm sm:text-sm"
            data-testid="event-gallery-caption"
          >
            {caption}
          </p>
        ) : null}

        {adjacentIndexes ? (
          <div className="pointer-events-auto max-w-full overflow-hidden rounded-md border border-white/15 bg-black/45 p-1.5 shadow-2xl backdrop-blur-xl">
            <div className="flex max-w-[min(76vw,44rem)] gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {album.images.map((image, index) => {
                const isActive = index === currentIndex

                return (
                  <button
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`View image ${index + 1} of ${album.images.length}`}
                    className="size-12 shrink-0 overflow-hidden rounded-[calc(var(--radius)-2px)] border border-transparent opacity-55 outline-none transition-[opacity,border-color] duration-200 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none data-[active=true]:border-white data-[active=true]:opacity-100 sm:size-14"
                    data-active={isActive}
                    key={image.id}
                    onClick={() => onSelect(index)}
                    ref={isActive ? activeThumbnailRef : undefined}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="size-full object-cover"
                      decoding="async"
                      src={image.src}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the overlay tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: PASS with four overlay tests.

- [ ] **Step 5: Lint the overlay and test**

Run:

```bash
pnpm exec eslint src/components/event-gallery-viewer-overlay.tsx tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: exit code 0.

- [ ] **Step 6: Commit the overlay**

```bash
git add src/components/event-gallery-viewer-overlay.tsx tests/int/event-gallery-viewer.int.spec.tsx
git commit -m "feat(gallery): add focused viewer overlay"
```

### Task 2: Connect the overlay to PhotoSwipe

**Files:**
- Modify: `src/components/event-gallery-viewer.tsx`
- Modify: `src/styles/custom.css`
- Modify: `tests/int/event-gallery-viewer.int.spec.tsx`
- Modify: `tests/int/event-gallery-render.int.spec.tsx`

**Interfaces:**
- Consumes: `EventGalleryViewerOverlay` and `EventGalleryViewerOverlayProps` from Task 1.
- Produces:
  - `getEventGalleryViewerSnapshot(pswp: PhotoSwipe): EventGalleryViewerSnapshot`
  - A PhotoSwipe UI element named `event-gallery-overlay` that hosts the React portal.
  - A viewer with PhotoSwipe defaults disabled and custom overlay controls wired to public PhotoSwipe methods.

- [ ] **Step 1: Add a failing PhotoSwipe bridge test**

Append the following bridge harness and test to
`tests/int/event-gallery-viewer.int.spec.tsx`. Place the `vi.hoisted` state and
`vi.mock` call before importing `EventGalleryViewer`.

```tsx
const photoSwipeHarness = vi.hoisted(() => ({
  instance: null as null | {
    destroy: ReturnType<typeof vi.fn>
    emit: (name: string) => void
    init: ReturnType<typeof vi.fn>
    loadAndOpen: ReturnType<typeof vi.fn>
    options: Record<string, unknown>
    pswp: {
      close: ReturnType<typeof vi.fn>
      currIndex: number
      currSlide: {
        currZoomLevel: number
        isZoomable: () => boolean
        toggleZoom: ReturnType<typeof vi.fn>
        zoomLevels: { initial: number; secondary: number }
      }
      element: HTMLElement
      goTo: ReturnType<typeof vi.fn>
      next: ReturnType<typeof vi.fn>
      on: (name: string, callback: () => void) => void
      prev: ReturnType<typeof vi.fn>
      ui: {
        registerElement: ReturnType<typeof vi.fn>
      }
    }
  },
}))

vi.mock('photoswipe/lightbox', () => ({
  default: class MockPhotoSwipeLightbox {
    handlers = new Map<string, Set<() => void>>()
    pswpHandlers = new Map<string, Set<() => void>>()
    options: Record<string, unknown>
    pswp: NonNullable<typeof photoSwipeHarness.instance>['pswp']
    destroy = vi.fn()
    init = vi.fn()

    constructor(options: Record<string, unknown>) {
      this.options = options
      const root = document.createElement('div')
      document.body.append(root)
      const toggleZoom = vi.fn()

      this.pswp = {
        close: vi.fn(),
        currIndex: 0,
        currSlide: {
          currZoomLevel: 1,
          isZoomable: () => true,
          toggleZoom,
          zoomLevels: { initial: 1, secondary: 2 },
        },
        element: root,
        goTo: vi.fn(),
        next: vi.fn(),
        on: (name, callback) => {
          const callbacks = this.pswpHandlers.get(name) ?? new Set()
          callbacks.add(callback)
          this.pswpHandlers.set(name, callbacks)
        },
        prev: vi.fn(),
        ui: {
          registerElement: vi.fn((definition: {
            onInit: (
              element: HTMLElement,
              pswp: NonNullable<typeof photoSwipeHarness.instance>['pswp'],
            ) => void
          }) => {
            const element = document.createElement('div')
            root.append(element)
            definition.onInit(element, this.pswp)
          }),
        },
      }

      photoSwipeHarness.instance = this
    }

    on(name: string, callback: () => void) {
      const callbacks = this.handlers.get(name) ?? new Set()
      callbacks.add(callback)
      this.handlers.set(name, callbacks)
    }

    emit(name: string) {
      this.handlers.get(name)?.forEach((callback) => callback())
      this.pswpHandlers.get(name)?.forEach((callback) => callback())
    }

    loadAndOpen = vi.fn((index: number) => {
      this.pswp.currIndex = index
      this.emit('uiRegister')
    })
  },
}))
```

Extend the imports:

```tsx
import { waitFor } from '@testing-library/react'
import { EventGalleryViewer } from '@/components/event-gallery-viewer'
```

Add this test:

```tsx
describe('EventGalleryViewer PhotoSwipe bridge', () => {
  it('disables default UI and routes overlay controls through PhotoSwipe', async () => {
    const onClose = vi.fn()

    render(<EventGalleryViewer album={album} initialIndex={1} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('02 / 03')).toBeTruthy()
    })

    const lightbox = photoSwipeHarness.instance!

    expect(lightbox.options).toMatchObject({
      arrowNext: false,
      arrowPrev: false,
      close: false,
      closeOnVerticalDrag: true,
      counter: false,
      loop: true,
      mainClass: 'event-gallery-lightbox',
      returnFocus: true,
      wheelToZoom: true,
      zoom: false,
    })
    expect(lightbox.loadAndOpen).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'View image 3 of 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close gallery' }))

    expect(lightbox.pswp.prev).toHaveBeenCalledOnce()
    expect(lightbox.pswp.next).toHaveBeenCalledOnce()
    expect(lightbox.pswp.currSlide.toggleZoom).toHaveBeenCalledOnce()
    expect(lightbox.pswp.goTo).toHaveBeenCalledWith(2)
    expect(lightbox.pswp.close).toHaveBeenCalledOnce()

    lightbox.pswp.currIndex = 2
    lightbox.pswp.currSlide.currZoomLevel = 2
    lightbox.emit('change')
    lightbox.emit('zoomPanUpdate')

    await waitFor(() => {
      expect(screen.getByText('03 / 03')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeTruthy()
    })

    lightbox.emit('close')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run the bridge test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: FAIL because the current viewer still registers imperative caption
and thumbnail elements, leaves PhotoSwipe's default UI enabled, and does not
render the React overlay.

- [ ] **Step 3: Replace the imperative UI with a React portal bridge**

Replace `src/components/event-gallery-viewer.tsx` with:

```tsx
'use client'

import 'photoswipe/style.css'

import type PhotoSwipe from 'photoswipe'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { EventGalleryViewerOverlay } from '@/components/event-gallery-viewer-overlay'
import type {
  EventGalleryAlbum,
  EventGalleryImage,
} from '@/lib/eventGalleryShared'

export const createEventGalleryDataSource = (images: EventGalleryImage[]) =>
  images.map((image) => ({
    alt: image.alt,
    height: image.height,
    src: image.src,
    width: image.width,
  }))

type EventGalleryViewerSnapshot = {
  currentIndex: number
  isZoomable: boolean
  isZoomed: boolean
}

type EventGalleryViewerPortal = EventGalleryViewerSnapshot & {
  element: HTMLElement
  pswp: PhotoSwipe
}

export const getEventGalleryViewerSnapshot = (
  pswp: PhotoSwipe,
): EventGalleryViewerSnapshot => {
  const slide = pswp.currSlide

  if (!slide) {
    return {
      currentIndex: pswp.currIndex,
      isZoomable: false,
      isZoomed: false,
    }
  }

  const zoomDifference = Math.abs(
    slide.zoomLevels.secondary - slide.zoomLevels.initial,
  )

  return {
    currentIndex: pswp.currIndex,
    isZoomable: slide.isZoomable() && zoomDifference >= 0.01,
    isZoomed: slide.currZoomLevel > slide.zoomLevels.initial + 0.01,
  }
}

type EventGalleryViewerProps = {
  album: EventGalleryAlbum
  initialIndex?: number
  onClose: () => void
}

export function EventGalleryViewer({
  album,
  initialIndex = 0,
  onClose,
}: EventGalleryViewerProps) {
  const [viewerPortal, setViewerPortal] =
    useState<EventGalleryViewerPortal | null>(null)

  useEffect(() => {
    const hasMultipleImages = album.images.length > 1
    const lightbox = new PhotoSwipeLightbox({
      arrowNext: false,
      arrowPrev: false,
      bgOpacity: 1,
      close: false,
      closeOnVerticalDrag: true,
      counter: false,
      dataSource: createEventGalleryDataSource(album.images),
      loop: hasMultipleImages,
      mainClass: 'event-gallery-lightbox',
      paddingFn: (viewportSize) => {
        const showSidePreviewLane = hasMultipleImages && viewportSize.x >= 1024

        return {
          bottom: hasMultipleImages ? (viewportSize.x < 640 ? 104 : 124) : 24,
          left: showSidePreviewLane ? 128 : 16,
          right: showSidePreviewLane ? 128 : 16,
          top: 72,
        }
      },
      pswpModule: () => import('photoswipe'),
      returnFocus: true,
      wheelToZoom: true,
      zoom: false,
    })

    lightbox.on('uiRegister', () => {
      lightbox.pswp?.ui?.registerElement({
        appendTo: 'root',
        className: 'event-gallery-overlay',
        name: 'event-gallery-overlay',
        onInit: (element, pswp) => {
          const syncViewerPortal = () => {
            setViewerPortal({
              element,
              pswp,
              ...getEventGalleryViewerSnapshot(pswp),
            })
          }

          pswp.on('change', syncViewerPortal)
          pswp.on('zoomPanUpdate', syncViewerPortal)
          syncViewerPortal()
        },
        order: 10,
      })
    })
    lightbox.on('close', onClose)
    lightbox.init()
    lightbox.loadAndOpen(
      Math.min(Math.max(initialIndex, 0), Math.max(album.images.length - 1, 0)),
    )

    return () => {
      lightbox.destroy()
    }
  }, [album, initialIndex, onClose])

  if (!viewerPortal) {
    return null
  }

  const { currentIndex, element, isZoomable, isZoomed, pswp } = viewerPortal

  return createPortal(
    <EventGalleryViewerOverlay
      album={album}
      currentIndex={currentIndex}
      isZoomable={isZoomable}
      isZoomed={isZoomed}
      onClose={() => pswp.close()}
      onNext={() => pswp.next()}
      onPrevious={() => pswp.prev()}
      onSelect={(index) => pswp.goTo(index)}
      onToggleZoom={() => pswp.currSlide?.toggleZoom()}
    />,
    element,
  )
}
```

- [ ] **Step 4: Add the scoped PhotoSwipe stage styles**

Append to `src/styles/custom.css`:

```css
/* Event Gallery focused carousel */
.event-gallery-lightbox .pswp__bg {
  background: #111416;
}

.event-gallery-lightbox .event-gallery-overlay {
  position: absolute;
  inset: 0;
  z-index: 1550;
  pointer-events: none;
}

.event-gallery-lightbox .event-gallery-side-preview {
  box-shadow: 0 18px 60px rgb(0 0 0 / 35%);
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .event-gallery-lightbox .event-gallery-side-preview {
    transition: none;
  }
}
```

- [ ] **Step 5: Run the focused viewer and existing render tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
```

Expected: PASS for the new viewer tests and all existing Event Gallery render
tests.

- [ ] **Step 6: Add a focus-restoration regression assertion**

Update the partial viewer mock in
`tests/int/event-gallery-render.int.spec.tsx` so it exposes a close control:

```tsx
EventGalleryViewer: ({
  album,
  onClose,
}: {
  album: { title: string }
  onClose: () => void
}) => (
  <div data-testid="event-gallery-viewer">
    {album.title}
    <button onClick={onClose} type="button">
      Close test viewer
    </button>
  </div>
),
```

Extend the existing “opens the selected album viewer” test after its current
assertion:

```tsx
const opener = screen.getByRole('button', {
  name: 'Open Yoga Day gallery with 2 images',
})

fireEvent.click(screen.getByRole('button', { name: 'Close test viewer' }))

await waitFor(() => {
  expect(document.activeElement).toBe(opener)
})
```

Change that test callback to `async` and add `waitFor` to the Testing Library
import. This verifies that the existing `EventGalleryClient` focus-restoration
contract survives the viewer redesign.

- [ ] **Step 7: Re-run the focused viewer and render tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
```

Expected: both suites pass, including the focus-restoration assertion.

- [ ] **Step 8: Lint all changed implementation and test files**

Run:

```bash
pnpm exec eslint src/components/event-gallery-viewer.tsx src/components/event-gallery-viewer-overlay.tsx tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
```

Expected: exit code 0.

- [ ] **Step 9: Commit the PhotoSwipe bridge and styles**

```bash
git add src/components/event-gallery-viewer.tsx src/components/event-gallery-viewer-overlay.tsx src/styles/custom.css tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
git commit -m "feat(gallery): style focused carousel"
```

### Task 3: Verify behavior across the Event Gallery system

**Files:**
- Verify: `src/components/event-gallery-viewer.tsx`
- Verify: `src/components/event-gallery-viewer-overlay.tsx`
- Verify: `src/styles/custom.css`
- Verify: `tests/int/event-gallery-viewer.int.spec.tsx`

**Interfaces:**
- Consumes: the completed overlay and PhotoSwipe bridge.
- Produces: a lint-clean, type-safe, regression-tested viewer that matches the
  approved desktop, mobile, zoomed, reduced-motion, and single-image states.

- [ ] **Step 1: Run every Event Gallery integration test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-selection.int.spec.tsx tests/int/gallery-albums.int.spec.ts
```

Expected: all selected suites pass.

- [ ] **Step 2: Run project type checking**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Run project lint**

Run:

```bash
pnpm lint
```

Expected: exit code 0.

- [ ] **Step 4: Run the production build**

Run:

```bash
pnpm build
```

Expected: Next.js completes the production build successfully.

- [ ] **Step 5: Verify the approved states in a browser**

Run:

```bash
pnpm dev
```

Open a page containing Event Gallery and verify:

1. A multi-image album opens on the selected image with a charcoal stage,
   contained active image, Lucide controls, counter, caption, desktop side
   previews, and floating thumbnails.
2. Previous, next, thumbnail, swipe, arrow keys, and looped navigation all keep
   the overlay synchronized.
3. Zoom changes the icon to “Zoom out” and hides side previews; returning to fit
   restores them.
4. Narrow mobile width hides side previews while preserving swipe, arrows, the
   compact dock, and 44-pixel control targets.
5. A single-image album has no arrows, side previews, or thumbnail dock.
6. Escape and the close button dismiss the viewer and return focus to the album
   card.
7. With reduced motion enabled, overlay transitions are removed.

Expected: every state matches the approved Focused Carousel specification
without changes to album cards or CMS behavior.

- [ ] **Step 6: Confirm a clean implementation diff**

Run:

```bash
git status --short
git diff --check
```

Expected: no uncommitted implementation files and no whitespace errors.

'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const canvasWidth = 1600
const canvasHeight = 900
const contentWidth = 1440
const safePadding = 80
const availableHeight = canvasHeight - safePadding * 2

const waitForImage = (image: HTMLImageElement) => {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve()
      : Promise.reject(
          new Error(`Thumbnail image failed to load: ${image.currentSrc || image.src}`),
        )
  }

  return new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener(
      'error',
      () => reject(new Error(`Thumbnail image failed to load: ${image.currentSrc || image.src}`)),
      { once: true },
    )
  })
}

const afterAnimationFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

type BlockThumbnailPreviewStageProps = {
  alignment: 'center' | 'top'
  children: ReactNode
  label: string
}

export function BlockThumbnailPreviewStage({
  alignment,
  children,
  label,
}: BlockThumbnailPreviewStageProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    let active = true

    const prepare = async () => {
      const content = contentRef.current

      if (!content) {
        throw new Error(`Thumbnail content was not mounted: ${label}`)
      }

      await document.fonts.ready

      const images = Array.from(content.querySelectorAll('img'))

      // Blocks that render a logo per breakpoint leave the hidden copy lazy and
      // zero-sized, so it never enters the viewport and its load event never
      // fires. Forcing eager loading keeps that from stalling the capture.
      for (const image of images) {
        image.loading = 'eager'
      }

      await Promise.all(images.map(waitForImage))
      await afterAnimationFrame()
      await afterAnimationFrame()

      if (!active) {
        return
      }

      const contentHeight = Math.max(content.scrollHeight, content.getBoundingClientRect().height)
      const nextScale = contentHeight > 0 ? Math.min(1, availableHeight / contentHeight) : 1

      setScale(nextScale)
      setReady(true)
    }

    void prepare().catch((caughtError: unknown) => {
      if (!active) {
        return
      }

      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)

      setError(message)
      console.error(message)
    })

    return () => {
      active = false
    }
  }, [label])

  const positionStyle =
    alignment === 'top'
      ? {
          left: '50%',
          top: safePadding,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
        }
      : {
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }

  return (
    <main
      aria-label={`${label} thumbnail preview`}
      className="relative overflow-hidden bg-background"
      data-block-thumbnail-canvas="true"
      data-block-thumbnail-error={error ?? undefined}
      data-block-thumbnail-ready={ready ? 'true' : 'false'}
      style={{ height: canvasHeight, width: canvasWidth }}
    >
      <style>{`nextjs-portal { display: none !important; } [data-block-thumbnail-canvas] *, [data-block-thumbnail-canvas] *::before, [data-block-thumbnail-canvas] *::after { animation: none !important; caret-color: transparent !important; transition: none !important; }`}</style>
      <div
        className="absolute opacity-0 data-[ready=true]:opacity-100"
        data-ready={ready ? 'true' : 'false'}
        ref={contentRef}
        style={{ ...positionStyle, width: contentWidth }}
      >
        {children}
      </div>
    </main>
  )
}

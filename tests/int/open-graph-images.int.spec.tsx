import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/og', () => ({
  ImageResponse: class {
    element: unknown
    options: unknown

    constructor(element: unknown, options: unknown) {
      this.element = element
      this.options = options
    }
  },
}))

import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
import type { OpenGraphMediaImage } from '@/lib/media'

const remoteImage: OpenGraphMediaImage = {
  height: 512,
  src: 'https://assets.snmih.tanish.im/Logo.avif',
  width: 512,
}

describe('Open Graph image loading', () => {
  it('preserves a successful renderer-supported image data URL', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('logo', {
        headers: { 'content-type': 'image/webp; charset=binary' },
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toEqual({
      height: 512,
      src: 'data:image/webp;base64,bG9nbw==',
      width: 512,
    })
    expect(fetcher).toHaveBeenCalledWith(
      remoteImage.src,
      expect.objectContaining({ cache: 'force-cache', signal: expect.any(Object) }),
    )
  })

  it('normalizes a successful AVIF response to a PNG data URL', async () => {
    const avif = await sharp({
      create: {
        background: { alpha: 1, b: 86, g: 52, r: 24 },
        channels: 4,
        height: 8,
        width: 8,
      },
    })
      .avif()
      .toBuffer()
    const fetcher = vi.fn().mockResolvedValue(
      new Response(avif, {
        headers: { 'content-type': 'image/avif' },
      }),
    )

    const result = await loadOpenGraphRemoteImage(remoteImage, { fetcher })

    expect(result).toMatchObject({ height: 512, width: 512 })
    expect(result?.src).toMatch(/^data:image\/png;base64,/)

    const png = Buffer.from(result?.src.split(',', 2)[1] ?? '', 'base64')

    await expect(sharp(png).metadata()).resolves.toMatchObject({
      format: 'png',
      height: 8,
      width: 8,
    })
  })

  it('omits an AVIF response that cannot be normalized', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('not-an-avif', {
        headers: { 'content-type': 'image/avif' },
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('omits a missing image without fetching', async () => {
    const fetcher = vi.fn()

    await expect(loadOpenGraphRemoteImage(undefined, { fetcher })).resolves.toBeUndefined()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('omits an unsuccessful response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('unavailable', {
        headers: { 'content-type': 'text/plain' },
        status: 503,
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('omits a non-image response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<html />', {
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('omits a rejected remote request', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('aborts a remote request after the configured timeout', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      }),
    )

    await expect(
      loadOpenGraphRemoteImage(remoteImage, { fetcher, timeoutMs: 5 }),
    ).resolves.toBeUndefined()
  })

  it('renders the local preview as a full 1200x630 fallback without text', async () => {
    const response = await createOpenGraphFallbackResponse()
    const fallback = response as unknown as { element: ReactNode; options: unknown }
    const markup = renderToStaticMarkup(fallback.element)

    expect(fallback.options).toEqual({ height: 630, width: 1200 })
    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).toContain('width="1672"')
    expect(markup).toContain('height="941"')
    expect(markup).toContain('object-fit:cover')
    expect(markup).not.toContain('SNMIH')
  })
})

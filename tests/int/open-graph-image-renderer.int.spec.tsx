// @vitest-environment node

import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'

import { loadOpenGraphRemoteImage } from '@/lib/openGraphImages'
import type { OpenGraphMediaImage } from '@/lib/media'

const remoteImage: OpenGraphMediaImage = {
  height: 8,
  src: 'https://assets.snmih.tanish.im/Logo.avif',
  width: 8,
}

describe('Open Graph image renderer compatibility', () => {
  it('renders a fetched AVIF logo through the real ImageResponse renderer', async () => {
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
    const image = await loadOpenGraphRemoteImage(remoteImage, { fetcher })

    expect(image).toBeDefined()

    const response = new ImageResponse(
      // eslint-disable-next-line @next/next/no-img-element -- this exercises next/og's native renderer.
      <img alt="" src={image?.src} width={8} height={8} />,
      { height: 8, width: 8 },
    )
    const output = new Uint8Array(await response.arrayBuffer())

    expect(Array.from(output.slice(0, 4))).toEqual([137, 80, 78, 71])
  })
})

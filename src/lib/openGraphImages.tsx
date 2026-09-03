import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'

import type { OpenGraphMediaImage } from '@/lib/media'

export const OPEN_GRAPH_SIZE = { height: 630, width: 1200 } as const

const FALLBACK_IMAGE_SIZE = { height: 941, width: 1672 } as const
const REMOTE_IMAGE_TIMEOUT_MS = 3_000
const fallbackImagePath = join(
  process.cwd(),
  'src/assets/open-graph/SNMIH-Preview-og-image.png',
)

type OpenGraphImageFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

type LoadOpenGraphRemoteImageOptions = {
  fetcher?: OpenGraphImageFetcher
  timeoutMs?: number
}

let fallbackImageDataURLPromise: Promise<string> | undefined

const normalizeOpenGraphImage = async ({
  contentType,
  data,
}: {
  contentType: string
  data: Buffer
}): Promise<{ contentType: string; data: Buffer }> => {
  if (contentType !== 'image/avif') {
    return { contentType, data }
  }

  return {
    contentType: 'image/png',
    data: await sharp(data).png().toBuffer(),
  }
}

const getFallbackImageDataURL = (): Promise<string> => {
  fallbackImageDataURLPromise ??= readFile(fallbackImagePath, 'base64').then(
    (data) => `data:image/png;base64,${data}`,
  )

  return fallbackImageDataURLPromise
}

export const loadOpenGraphRemoteImage = async (
  image: OpenGraphMediaImage | undefined,
  {
    fetcher = fetch,
    timeoutMs = REMOTE_IMAGE_TIMEOUT_MS,
  }: LoadOpenGraphRemoteImageOptions = {},
): Promise<OpenGraphMediaImage | undefined> => {
  if (!image) {
    return undefined
  }

  try {
    const response = await fetcher(image.src, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const contentType = response.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase()

    if (!response.ok || !contentType?.startsWith('image/')) {
      return undefined
    }

    const normalizedImage = await normalizeOpenGraphImage({
      contentType,
      data: Buffer.from(await response.arrayBuffer()),
    })

    return {
      ...image,
      src: `data:${normalizedImage.contentType};base64,${normalizedImage.data.toString('base64')}`,
    }
  } catch {
    return undefined
  }
}

export const createOpenGraphFallbackResponse = async (): Promise<ImageResponse> => {
  const src = await getFallbackImageDataURL()

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- next/og renders native image elements.
    <img
      src={src}
      alt=""
      width={FALLBACK_IMAGE_SIZE.width}
      height={FALLBACK_IMAGE_SIZE.height}
      style={{ height: '100%', objectFit: 'cover', width: '100%' }}
    />,
    { ...OPEN_GRAPH_SIZE },
  )
}

import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { reconcileMediaStorage } from '@/lib/mediaStorage'

const isAuthorized = (request: Request): boolean => {
  const configuredToken = process.env.MEDIA_RECONCILE_TOKEN?.trim()

  if (!configuredToken) {
    return false
  }

  const authorization = request.headers.get('authorization')?.trim()
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null
  const headerToken = request.headers.get('x-media-reconcile-token')?.trim() || null

  return bearerToken === configuredToken || headerToken === configuredToken
}

export const POST = async (request: Request) => {
  if (!process.env.MEDIA_RECONCILE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        error: 'MEDIA_RECONCILE_TOKEN is not configured.',
      },
      { status: 503 },
    )
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: 'Unauthorized.',
      },
      { status: 401 },
    )
  }

  const payload = await getPayload({
    config: configPromise,
  })
  const result = await reconcileMediaStorage({
    payload,
  })

  return NextResponse.json(result)
}

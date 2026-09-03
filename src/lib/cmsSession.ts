import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { User } from '@/payload-types'

export const getCurrentCMSUser = cache(async (): Promise<User | null> => {
  const payload = await getPayload({
    config: configPromise,
  })
  const requestHeaders = new Headers(await getHeaders())
  const authResult = await payload.auth({
    canSetHeaders: false,
    headers: requestHeaders,
  })

  return (authResult.user as User | null | undefined) ?? null
})

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CelebrationHost } from '@/components/celebration/CelebrationHost'
import { toCelebrationView } from '@/lib/celebrations/view'
import { getSiteTimeZone } from '@/lib/siteTimeZone.server'
import type { Celebration } from '@/payload-types'

type CelebrationBlockLike = {
  celebration?: Celebration | string | null
}

const getPublishedCelebration = async (id: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'celebrations',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
  })
  return result.docs[0] ?? null
}

/** Registers the chosen celebration for this page; the modal renders in the browser on its dates. */
export async function CelebrationBlockComponent({ celebration }: CelebrationBlockLike) {
  if (!celebration) return null

  const [timeZone, doc] = await Promise.all([
    getSiteTimeZone(),
    typeof celebration === 'string' ? getPublishedCelebration(celebration) : celebration,
  ])
  const view = toCelebrationView(doc, timeZone)

  return view ? <CelebrationHost celebrations={[view]} priority="page" timeZone={timeZone} /> : null
}

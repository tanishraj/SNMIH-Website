import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import {
  normalizeNewsEventDetailTemplate,
  type ResolvedNewsEventDetailTemplate,
} from '@/lib/newsEventDetailTemplateShared'

export async function fetchNewsEventDetailTemplate(
  payload: Pick<Payload, 'findGlobal' | 'logger'>,
): Promise<ResolvedNewsEventDetailTemplate> {
  try {
    const value = await payload.findGlobal({
      slug: 'news-events-detail-template',
      depth: 2,
      draft: false,
      overrideAccess: true,
    })

    return normalizeNewsEventDetailTemplate(value)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to load the News & Events detail template.',
    })

    return normalizeNewsEventDetailTemplate(null)
  }
}

const loadPayload = cache(async () => getPayload({ config: configPromise }))

const loadTemplate = async () => fetchNewsEventDetailTemplate(await loadPayload())

export const getNewsEventDetailTemplate = unstable_cache(
  loadTemplate,
  ['news-events-detail-template'],
  {
    revalidate: false,
    tags: [CMS_CACHE_TAGS.globals],
  },
)

'use client'

import { CelebrationPreview } from '@/components/celebration/CelebrationPreview'
import { toCelebrationView } from '@/lib/celebrations/view'
import { DEFAULT_SITE_TIME_ZONE } from '@/lib/siteTimeZone'
import type { Celebration } from '@/payload-types'

/** Live preview shows the chosen celebration as a static card rather than opening a modal. */
export function CelebrationBlockPreview({
  celebration,
}: {
  celebration?: Celebration | string | null
}) {
  const view =
    celebration && typeof celebration === 'object'
      ? toCelebrationView(celebration, DEFAULT_SITE_TIME_ZONE)
      : null

  if (!view) {
    return (
      <p className="mx-auto max-w-screen-2xl px-4 py-6 text-center text-sm text-muted-foreground">
        Celebration block: choose a published, enabled celebration to preview it here.
      </p>
    )
  }

  return <CelebrationPreview view={view} />
}

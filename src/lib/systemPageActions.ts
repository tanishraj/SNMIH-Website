import type { NavigationLink, Page } from '@/payload-types'

import type { SystemPageActionLink } from '@/components/system-pages/types'
import { resolveCmsLink, type CmsLinkValue } from '@/lib/cmsLinks'

type SystemPageActionValue = {
  label?: string | null
  link?: string | number | NavigationLink | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  url?: string | null
}

export const resolveSystemPageAction = (
  value: SystemPageActionValue | null | undefined,
): SystemPageActionLink | null => {
  if (!value?.label) {
    return null
  }

  const normalizedValue: CmsLinkValue = {
    link: typeof value.link === 'string' ? null : (value.link ?? null),
    linkType: value.linkType ?? null,
    openInNewTab: value.openInNewTab ?? null,
    page: typeof value.page === 'string' ? null : (value.page ?? null),
    url: value.url ?? null,
  }

  const resolved = resolveCmsLink(normalizedValue)

  if (!resolved.href) {
    return null
  }

  return {
    label: value.label,
    openInNewTab: resolved.openInNewTab ?? null,
    url: resolved.href,
  }
}

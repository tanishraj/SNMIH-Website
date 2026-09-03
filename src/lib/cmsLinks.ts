import type { Media, NavigationLink, Page } from '@/payload-types'

import { getMediaAbsoluteUrl, isMediaDoc } from './media'
import { resolveNavigationLink } from './navigationLinks'
import { getPageHref } from './pagePaths'

export type CmsActionIndicator = 'download' | 'none'
export type CmsActionIndicatorPosition = 'left' | 'right'

export type CmsLinkValue = {
  file?: string | number | Media | null
  fileBehavior?: 'download' | 'view' | null
  fileIconPosition?: CmsActionIndicatorPosition | null
  link?: string | number | NavigationLink | null
  linkType?: 'page' | 'custom' | 'file' | null
  openFileInNewTab?: boolean | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  showFileIcon?: boolean | null
  url?: string | null
}

export type CmsActionVariant =
  'default' | 'link' | 'outline' | 'primary' | 'secondary' | 'white' | 'whiteOutline'

export type CmsActionMode = 'button' | 'link'

export type CmsActionValue = CmsLinkValue & {
  label?: string | null
  mode?: CmsActionMode | null
  showArrow?: boolean | null
  variant?: CmsActionVariant | null
}

export type ResolvedCmsAction = {
  download?: string | true
  href: string
  indicator?: CmsActionIndicator
  indicatorPosition?: CmsActionIndicatorPosition
  label: string
  mode: CmsActionMode
  openInNewTab?: boolean
  showArrow: boolean
  variant: CmsActionVariant
}

export type ResolvedCmsLink = {
  download?: string | true
  href?: string
  indicator?: CmsActionIndicator
  indicatorPosition?: CmsActionIndicatorPosition
  openInNewTab?: boolean
}

export const resolveCmsLink = (value: CmsLinkValue): ResolvedCmsLink => {
  if (value.linkType === 'file') {
    const href = getMediaAbsoluteUrl(value.file)
    if (!href) return {}

    const downloadsFile = value.fileBehavior === 'download'
    const filename = isMediaDoc(value.file) ? value.file.filename?.trim() : undefined

    return {
      download: downloadsFile ? filename || true : undefined,
      href,
      indicator: downloadsFile ? (value.showFileIcon === false ? 'none' : 'download') : undefined,
      indicatorPosition: downloadsFile
        ? value.fileIconPosition === 'right'
          ? 'right'
          : 'left'
        : undefined,
      openInNewTab: downloadsFile ? false : (value.openFileInNewTab ?? true),
    }
  }

  const reusableLink = resolveNavigationLink(value.link)
  const legacyHref = value.linkType === 'page' ? getPageHref(value.page) : (value.url ?? undefined)
  const href = reusableLink.href ?? legacyHref

  if (!href) {
    return {}
  }

  return {
    href,
    openInNewTab: value.openInNewTab ?? reusableLink.openInNewTab ?? undefined,
  }
}

export const resolveCmsActions = (
  actions?: CmsActionValue[] | null,
  // Applied to rows saved before display mode moved onto the action itself.
  fallbackMode: CmsActionMode = 'link',
): ResolvedCmsAction[] =>
  (actions ?? []).flatMap((action) => {
    const label = action.label?.trim()
    const destination = resolveCmsLink(action)

    return label && destination.href
      ? [
          {
            download: destination.download,
            href: destination.href,
            indicator: destination.indicator,
            indicatorPosition: destination.indicatorPosition,
            label,
            mode: action.mode ?? fallbackMode,
            openInNewTab: destination.openInNewTab,
            showArrow: Boolean(action.showArrow),
            variant: action.variant ?? 'default',
          },
        ]
      : []
  })

export const getCmsActionAnchorProps = (
  action: Pick<ResolvedCmsAction, 'download' | 'href' | 'openInNewTab'>,
) => ({
  download: action.download,
  href: action.href,
  rel: action.openInNewTab ? ('noreferrer' as const) : undefined,
  target: action.openInNewTab ? ('_blank' as const) : undefined,
})

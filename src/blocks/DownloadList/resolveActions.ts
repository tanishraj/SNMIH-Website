import { getMediaDownloadUrl } from '@/lib/media'
import {
  resolveCmsActions,
  resolveCmsLink,
  type CmsActionVariant,
  type CmsActionValue,
  type CmsLinkValue,
} from '@/lib/cmsLinks'
import type { Media, Page } from '@/payload-types'

import type { DownloadActionSettings, ResolvedDownloadAction } from './types'

export type DownloadManualActionInput = CmsLinkValue & {
  actionAppearance?: string | null
  actionType?: 'download' | 'link' | null
  file?: string | number | Media | null
  icon?: string | null
  iconMode?: string | null
  label?: string | null
  page?: string | number | Page | null
}

export type DownloadDocumentActionInput = CmsLinkValue & {
  actionType?: 'custom' | 'download' | 'view' | null
  label?: string | null
  mode?: 'button' | 'link' | null
  showArrow?: boolean | null
  variant?: CmsActionVariant | null
  viewOpenInNewTab?: boolean | null
}

export type AutomaticDownloadActionFallback = DownloadActionSettings & {
  downloadHref?: string
  viewHref?: string
}

type ResolveDocumentActionsInput = {
  customActions?: CmsActionValue[] | null
  documentActions?: DownloadDocumentActionInput[] | null
  fallback: AutomaticDownloadActionFallback
  legacyActions?: DownloadManualActionInput[] | null
}

const createResolvedAction = (
  action: Omit<ResolvedDownloadAction, 'showArrow' | 'variant'> &
    Partial<Pick<ResolvedDownloadAction, 'showArrow' | 'variant'>>,
): ResolvedDownloadAction => ({
  ...action,
  showArrow: action.showArrow ?? false,
  variant: action.variant ?? 'default',
})

const resolveManualActions = (
  actions?: DownloadManualActionInput[] | null,
): ResolvedDownloadAction[] =>
  (actions ?? []).slice(0, 2).flatMap((action): ResolvedDownloadAction[] => {
    const label = action.label?.trim()
    if (!label) return []

    if (action.actionType === 'download') {
      const href = getMediaDownloadUrl(action.file)
      return href
        ? [
            createResolvedAction({
              href,
              kind: 'download' as const,
              label,
              mode: 'button',
              openInNewTab: false,
            }),
          ]
        : []
    }

    if (action.actionType === 'link') {
      const destination = resolveCmsLink({
        ...action,
        url: action.url?.trim() || undefined,
      })
      return destination.href
        ? [
            createResolvedAction({
              href: destination.href,
              kind: 'view' as const,
              label,
              mode: 'link',
              openInNewTab: Boolean(destination.openInNewTab),
            }),
          ]
        : []
    }

    return []
  })

const resolveCustomAction = (actions?: CmsActionValue[] | null): ResolvedDownloadAction[] =>
  resolveCmsActions(actions)
    .slice(0, 1)
    .map((action) => ({
      ...action,
      kind: 'custom' as const,
      openInNewTab: Boolean(action.openInNewTab),
    }))

const resolveAutomaticActions = (
  fallback: AutomaticDownloadActionFallback,
): ResolvedDownloadAction[] => {
  const resolvedActions: ResolvedDownloadAction[] = []
  if (fallback.showView === true && fallback.viewHref) {
    resolvedActions.push(
      createResolvedAction({
        href: fallback.viewHref,
        kind: 'view',
        label: 'View Document',
        mode: 'link',
        openInNewTab: fallback.openViewInNewTab ?? true,
      }),
    )
  }
  if (fallback.showDownload !== false && fallback.downloadHref) {
    resolvedActions.push(
      createResolvedAction({
        href: fallback.downloadHref,
        kind: 'download',
        label: 'Download',
        mode: 'button',
        openInNewTab: false,
      }),
    )
  }

  return resolvedActions
}

const resolveNewDocumentActions = (
  actions: DownloadDocumentActionInput[],
  fallback: AutomaticDownloadActionFallback,
): ResolvedDownloadAction[] =>
  actions.slice(0, 2).flatMap((action): ResolvedDownloadAction[] => {
    if (action.actionType === 'download') {
      return fallback.downloadHref
        ? [
            createResolvedAction({
              href: fallback.downloadHref,
              kind: 'download',
              label: action.label?.trim() || 'Download',
              mode: 'button',
              openInNewTab: false,
            }),
          ]
        : []
    }

    if (action.actionType === 'view') {
      return fallback.viewHref
        ? [
            createResolvedAction({
              href: fallback.viewHref,
              kind: 'view',
              label: action.label?.trim() || 'View',
              mode: 'button',
              openInNewTab: action.viewOpenInNewTab ?? true,
            }),
          ]
        : []
    }

    if (action.actionType !== 'custom') return []

    const [resolved] = resolveCmsActions([action])
    if (!resolved) return []

    const mode = action.mode === 'button' ? 'button' : 'link'
    return [
      {
        ...resolved,
        kind: 'custom',
        mode,
        openInNewTab: Boolean(resolved.openInNewTab),
        showArrow: mode === 'button' && action.showArrow === true,
      },
    ]
  })

export function resolveDocumentActions({
  customActions,
  documentActions,
  fallback,
  legacyActions,
}: ResolveDocumentActionsInput): ResolvedDownloadAction[] {
  if ((documentActions ?? []).length > 0) {
    return resolveNewDocumentActions(documentActions ?? [], fallback)
  }

  const resolvedCustomActions = resolveCustomAction(customActions)
  if (resolvedCustomActions.length === 0) {
    const resolvedLegacyActions = resolveManualActions(legacyActions)
    if (resolvedLegacyActions.length > 0) return resolvedLegacyActions
  }

  return [...resolveAutomaticActions(fallback), ...resolvedCustomActions]
}

import { renderNewsEventDetailBlocks } from '@/blocks/renderNewsEventDetailBlocks'
import type { ResolvedNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'

export function NewsEventDetailPage({
  entry,
  template,
}: {
  entry: PublicNewsEventDetail
  template: ResolvedNewsEventDetailTemplate
}) {
  const automaticBreadcrumbs: ResolvedPageBreadcrumb[] = [
    { label: 'Home', url: '/' },
    { label: 'News & Events', url: '/news-events' },
    { label: entry.title },
  ]

  return renderNewsEventDetailBlocks(template, { automaticBreadcrumbs, entry })
}

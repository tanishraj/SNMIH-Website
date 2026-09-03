import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { PageContent } from './PageContent'
import { SystemModeFallbackPage } from './SystemFallbackPage'
import { getHomepagePath, getPageByPath, getSystemPageRenderState } from './pageData'
import {
  resolvePageBreadcrumbsForLayout,
  toBreadcrumbListStructuredData,
} from '@/lib/pageBreadcrumbs'
import { getRedirectByPath } from '@/lib/redirects'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'

export async function ManagedCmsPage({ segments }: { segments: string[] }) {
  const pathname = `/${segments.join('/')}`
  const systemPageState = await getSystemPageRenderState(pathname)

  if (systemPageState.page) {
    return <PageContent page={systemPageState.page} />
  }

  if (systemPageState.mode) {
    return <SystemModeFallbackPage mode={systemPageState.mode} />
  }

  const homepagePath = await getHomepagePath()

  if (homepagePath && pathname === homepagePath) {
    permanentRedirect('/')
  }

  const matchedRedirect = await getRedirectByPath(pathname)

  if (matchedRedirect?.permanent) {
    permanentRedirect(matchedRedirect.destination)
  }

  if (matchedRedirect) {
    redirect(matchedRedirect.destination)
  }

  const page = await getPageByPath(segments)

  if (!page) {
    notFound()
  }

  const pageUrl = toAbsoluteSiteUrl(pathname)
  const breadcrumbStructuredData = toBreadcrumbListStructuredData(
    resolvePageBreadcrumbsForLayout(page),
    toAbsoluteSiteUrl,
  )
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      url: pageUrl,
    },
    ...(breadcrumbStructuredData ? [breadcrumbStructuredData] : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <PageContent page={page} />
    </>
  )
}

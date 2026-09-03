import { PageContent } from './PageContent'
import { DefaultNotFoundPage } from './SystemFallbackPage'
import { getManagedNotFoundPage } from './pageData'

export default async function NotFoundPage() {
  const managedNotFoundPage = await getManagedNotFoundPage()

  if (managedNotFoundPage) {
    return <PageContent page={managedNotFoundPage} />
  }

  return <DefaultNotFoundPage />
}

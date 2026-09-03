import {
  getNewsEventPage,
  NewsEventsTabsRequestError,
  parseNewsEventsTabsPagination,
} from '@/lib/newsEvents'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const pagination = parseNewsEventsTabsPagination(new URL(request.url).searchParams)

  if (!pagination.ok) {
    return Response.json({ message: pagination.message }, { status: 400 })
  }

  try {
    return Response.json(
      await getNewsEventPage(
        pagination.classification,
        pagination.classificationIDs,
        pagination.page,
        pagination.limit,
        new Date().toISOString(),
      ),
    )
  } catch (error) {
    if (error instanceof NewsEventsTabsRequestError) {
      return Response.json({ message: error.message }, { status: 400 })
    }

    return Response.json({ message: 'Unable to load News & Events.' }, { status: 500 })
  }
}

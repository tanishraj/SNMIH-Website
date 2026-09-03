import { getPublishedReviewFeedPage, parseReviewFeedPagination } from '@/lib/reviewFeed'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const pagination = parseReviewFeedPagination(new URL(request.url).searchParams)

  if (!pagination.ok) {
    return Response.json({ message: pagination.message }, { status: 400 })
  }

  try {
    return Response.json(await getPublishedReviewFeedPage(pagination.page, pagination.limit))
  } catch {
    return Response.json({ message: 'Unable to load reviews.' }, { status: 500 })
  }
}

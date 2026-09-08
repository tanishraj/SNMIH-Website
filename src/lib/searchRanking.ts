type SearchDocument = { id: string | number; title: string }

export const SEARCH_BATCH_SIZE = 100

const normalize = (value: string) =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()

const rankTitle = (title: string, query: string): number => {
  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  if (query.split(' ').every((word) => title.includes(word))) return 3
  return 4
}

// Scan matching records in bounded batches, retaining only the best results.
// Applying the UI limit to the initial database query would hide stronger matches.
export async function findRankedSearchDocuments<T extends SearchDocument>(
  query: string,
  limit: number,
  fetchPage: (page: number) => Promise<{ docs: T[]; hasNextPage?: boolean }>,
): Promise<{ docs: T[] }> {
  const normalizedQuery = normalize(query)
  let best: Array<{ doc: T; rank: number; title: string }> = []
  let page = 1
  while (true) {
    const result = await fetchPage(page)
    best.push(
      ...result.docs.map((doc) => {
        const title = normalize(doc.title)
        return { doc, title, rank: rankTitle(title, normalizedQuery) }
      }),
    )
    best.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.title.localeCompare(b.title, 'en') ||
        String(a.doc.id).localeCompare(String(b.doc.id), 'en'),
    )
    best = best.slice(0, limit)
    if (!result.hasNextPage || !result.docs.length) break
    page += 1
  }
  return { docs: best.map(({ doc }) => doc) }
}

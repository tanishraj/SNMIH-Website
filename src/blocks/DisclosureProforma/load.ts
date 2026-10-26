import 'server-only'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import { canReadFeature } from '@/access/featureAccess'
import { getSiteTimeZone } from '@/lib/siteTimeZone.server'
import type { User } from '@/payload-types'
import type { Snapshot, Batch } from './shared'
import type { DisclosureQuery } from './request'

export class DisclosureReadError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}
export async function loadDisclosure(
  query: DisclosureQuery,
  user?: User | null,
): Promise<Snapshot> {
  if (
    query.draft &&
    (!user ||
      !canReadFeature(user, 'disclosureRecords') ||
      !canReadFeature(user, 'disclosurePeriods'))
  )
    throw new DisclosureReadError(
      'You do not have access to this disclosure preview.',
      user ? 403 : 401,
    )
  const payload = await getPayload({ config: configPromise })
  const mode = {
    depth: 0,
    draft: query.draft,
    overrideAccess: false,
    user: query.draft ? user : undefined,
  }
  const status: Where[] = query.draft ? [] : [{ _status: { equals: 'published' } }]
  const [datasets, periods, timeZone] = await Promise.all([
    payload.find({
      collection: 'disclosure-datasets',
      ...mode,
      limit: 1,
      where: { id: { equals: query.dataset } },
    }),
    payload.find({
      collection: 'disclosure-periods',
      ...mode,
      limit: 20,
      page: query.periodPage,
      sort: ['-asOf', 'id'],
      where: {
        and: [
          { dataset: { equals: query.dataset } },
          ...status,
          ...(query.periodQuery ? [{ label: { like: query.periodQuery } }] : []),
        ],
      },
    }),
    getSiteTimeZone(),
  ])
  const dataset = datasets.docs[0]
  if (!dataset) throw new DisclosureReadError('Disclosure dataset is unavailable.', 404)
  let selected =
    periods.docs.find((p) => p.id === query.period) ?? (!query.period ? periods.docs[0] : undefined)
  if (query.period && !selected) {
    const result = await payload.find({
      collection: 'disclosure-periods',
      ...mode,
      limit: 1,
      where: {
        and: [{ id: { equals: query.period } }, { dataset: { equals: query.dataset } }, ...status],
      },
    })
    selected = result.docs[0]
    if (!selected) throw new DisclosureReadError('Reporting period is unavailable.', 404)
  }
  const groups: Record<string, Batch> = {}
  if (selected)
    await Promise.all(
      query.groupKeys.map(async (key) => {
        const result = await payload.find({
          collection: 'disclosure-records',
          ...mode,
          limit: query.limit,
          page: query.page,
          sort: ['sortOrder', 'id'],
          select: { label: true, content: true, cells: true, details: true },
          where: {
            and: [
              { dataset: { equals: query.dataset } },
              { period: { equals: selected!.id } },
              { section: { equals: query.section } },
              { groupKey: { equals: key } },
              ...status,
              ...(query.query
                ? [
                    {
                      or: [
                        { label: { like: query.query } },
                        { department: { like: query.query } },
                        { 'content.value': { like: query.query } },
                        { 'cells.value': { like: query.query } },
                      ],
                    },
                  ]
                : []),
            ],
          },
        })
        groups[key] = {
          rows: result.docs.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.content?.value,
            valueState: row.content?.valueState,
            cells: row.cells,
            details: row.details,
          })),
          page: result.page ?? 1,
          total: result.totalDocs,
          totalPages: result.totalPages,
        }
      }),
    )
  return {
    timeZone,
    dataset: dataset.id,
    periods: periods.docs.map((p) => ({ id: p.id, label: p.label })),
    hasMorePeriods: periods.hasNextPage,
    periodPage: query.periodPage,
    period: selected?.id ?? '',
    updatedAt: dataset.publicUpdatedAt,
    updatedBy: dataset.publicUpdatedBy,
    updatedLabel: dataset.publicUpdatedAt
      ? new Intl.DateTimeFormat('en-IN', {
          timeZone,
          dateStyle: 'medium',
        }).format(new Date(dataset.publicUpdatedAt))
      : null,
    groups,
  }
}

import {
  APIError,
  commitTransaction,
  initTransaction,
  killTransaction,
  type Endpoint,
  type PayloadRequest,
} from 'payload'
import { formatAdminURL } from 'payload/shared'

import { hasFeature } from '@/access/featureAccess'
import type { DisclosureRecord, User } from '@/payload-types'

const jsonMessage = (message: string, status: number) => Response.json({ message }, { status })

const parseBody = async (req: PayloadRequest): Promise<Record<string, unknown> | null> => {
  if (typeof req.json !== 'function') return null

  try {
    const value = await req.json()
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const idOf = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'id' in value
      ? String(value.id)
      : ''

const withoutRowIds = <Row extends { id?: string | null }>(rows?: Row[] | null) =>
  rows?.map(({ id: _id, ...row }) => row)

/** Every editor-entered field of a record, without its identity, status or public stamp. */
export const copyRecordData = (record: DisclosureRecord, period: string) => {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    _status,
    publicUpdatedAt: _publicUpdatedAt,
    publicUpdatedBy: _publicUpdatedBy,
    period: _period,
    cells,
    details,
    ...fields
  } = record

  return {
    ...fields,
    cells: withoutRowIds(cells),
    details: withoutRowIds(details),
    period,
    _status: 'draft' as const,
  }
}

const authorize = (req: PayloadRequest): Response | User => {
  const user = req.user as User | null

  if (!user) return jsonMessage('Authentication is required.', 401)
  if (!hasFeature(user, 'disclosurePeriods') || !hasFeature(user, 'disclosureRecords')) {
    return jsonMessage('You need access to Disclosure Periods and Disclosure Records.', 403)
  }

  return user
}

const findPeriod = (req: PayloadRequest, user: User) =>
  req.payload.findByID({
    collection: 'disclosure-periods',
    id: String(req.routeParams?.id ?? ''),
    depth: 0,
    draft: true,
    joins: false,
    overrideAccess: false,
    req,
    user,
  })

const findRecords = (req: PayloadRequest, user: User, period: string) =>
  req.payload.find({
    collection: 'disclosure-records',
    depth: 0,
    draft: true,
    overrideAccess: false,
    pagination: false,
    req,
    sort: ['section', 'groupKey', 'sortOrder'],
    user,
    where: { period: { equals: period } },
  })

const failure = (req: PayloadRequest, error: unknown, message: string) => {
  if (error instanceof APIError && error.status < 500)
    return jsonMessage(error.message, error.status)
  req.payload.logger.error({ error, message })
  return jsonMessage(message, 500)
}

/**
 * Starts the next reporting month from an existing one: a draft period with the same details and
 * a draft copy of every record. Nothing is created unless every record copies.
 */
export const copyDisclosurePeriodEndpoint: Endpoint = {
  method: 'post',
  path: '/:id/copy',
  handler: async (req) => {
    const user = authorize(req)
    if (user instanceof Response) return user

    const body = await parseBody(req)
    const label = typeof body?.label === 'string' ? body.label.trim() : ''
    const asOf = typeof body?.asOf === 'string' ? new Date(body.asOf) : null
    if (!label) return jsonMessage('Enter a name for the new month.', 400)
    if (!asOf || Number.isNaN(asOf.getTime())) return jsonMessage('Choose a reporting date.', 400)

    const created: { collection: 'disclosure-periods' | 'disclosure-records'; id: string }[] = []
    const ownsTransaction = await initTransaction(req)
    // Without database transactions, initTransaction leaves a resolved promise on the request.
    const transactional =
      ownsTransaction ||
      (req.transactionID !== undefined && !(req.transactionID instanceof Promise))

    try {
      const source = await findPeriod(req, user)
      const dataset = idOf(source.dataset)
      const existing = await req.payload.count({
        collection: 'disclosure-periods',
        overrideAccess: false,
        req,
        user,
        where: { and: [{ dataset: { equals: dataset } }, { label: { equals: label } }] },
      })
      if (existing.totalDocs > 0) {
        throw new APIError(`A period named “${label}” already exists in this dataset.`, 409)
      }

      const records = await findRecords(req, user, String(source.id))
      const period = await req.payload.create({
        collection: 'disclosure-periods',
        data: {
          dataset,
          label,
          asOf: asOf.toISOString(),
          academicSession: source.academicSession,
          source: idOf(source.source) || null,
          sourceNote: source.sourceNote,
          _status: 'draft',
        },
        draft: true,
        overrideAccess: false,
        req,
        user,
      })
      created.push({ collection: 'disclosure-periods', id: period.id })

      for (const record of records.docs) {
        const copy = await req.payload.create({
          collection: 'disclosure-records',
          data: copyRecordData(record, period.id),
          draft: true,
          overrideAccess: false,
          req,
          user,
        })
        created.push({ collection: 'disclosure-records', id: copy.id })
      }

      if (ownsTransaction) await commitTransaction(req)

      const editURL = formatAdminURL({
        adminRoute: req.payload.config.routes.admin,
        path: `/collections/disclosure-periods/${period.id}`,
        relative: true,
        serverURL: req.payload.config.serverURL,
      })
      return Response.json(
        { editURL, id: period.id, records: records.docs.length },
        { status: 201 },
      )
    } catch (error) {
      if (ownsTransaction) await killTransaction(req)
      // Without database transactions, remove what was already copied so no partial month remains.
      if (!transactional) {
        for (const doc of created.reverse()) {
          await req.payload
            .delete({ collection: doc.collection, id: doc.id, overrideAccess: true })
            .catch(() => undefined)
        }
      }
      return failure(req, error, 'Unable to copy this month.')
    }
  },
}

/** Publishes a reporting period together with every record in it that has unpublished changes. */
export const publishDisclosurePeriodEndpoint: Endpoint = {
  method: 'post',
  path: '/:id/publish-month',
  handler: async (req) => {
    const user = authorize(req)
    if (user instanceof Response) return user

    const ownsTransaction = await initTransaction(req)

    try {
      const period = await findPeriod(req, user)
      const records = await findRecords(req, user, String(period.id))

      // The period goes first: a record only reaches the public page once its period is live.
      if (period._status !== 'published') {
        await req.payload.update({
          collection: 'disclosure-periods',
          id: period.id,
          data: { _status: 'published' },
          overrideAccess: false,
          req,
          user,
        })
      }

      const pending = records.docs.filter((record) => record._status !== 'published')
      for (const record of pending) {
        await req.payload.update({
          collection: 'disclosure-records',
          id: record.id,
          data: { _status: 'published' },
          overrideAccess: false,
          req,
          user,
        })
      }

      if (ownsTransaction) await commitTransaction(req)

      return Response.json({
        period: period.label,
        published: pending.length,
        records: records.docs.length,
      })
    } catch (error) {
      if (ownsTransaction) await killTransaction(req)
      return failure(req, error, 'Unable to publish this month.')
    }
  },
}

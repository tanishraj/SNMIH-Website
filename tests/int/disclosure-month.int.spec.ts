// @vitest-environment node
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  copyDisclosurePeriodEndpoint,
  publishDisclosurePeriodEndpoint,
} from '@/endpoints/disclosureMonth'
import type { DisclosurePeriod, User } from '@/payload-types'
import { createTestMongoServer } from '../helpers/mongoMemoryServer'

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

let payload: Payload
let stopMongo: (() => Promise<void>) | undefined
let admin: User
let september: DisclosurePeriod
let datasetID: string
let sequence = 0

const call = async (
  endpoint: typeof copyDisclosurePeriodEndpoint,
  id: string,
  user: User | null,
  body: object = {},
) => {
  const req = await createLocalReq(
    {
      user: user ?? undefined,
      req: {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => body,
      },
    },
    payload,
  )
  req.routeParams = { id }
  return endpoint.handler(req)
}
const copy = (user: User | null, label: string, asOf = '2026-10-31T06:30:00.000Z') =>
  call(copyDisclosurePeriodEndpoint, september.id, user, { label, asOf })
const recordsOf = (period: string, draft = true) =>
  payload.find({
    collection: 'disclosure-records',
    draft,
    depth: 0,
    pagination: false,
    sort: 'sortOrder',
    overrideAccess: true,
    where: { period: { equals: period } },
  })
const periodsNamed = (label: string) =>
  payload.count({
    collection: 'disclosure-periods',
    overrideAccess: true,
    where: { label: { equals: label } },
  })
const siteManager = (features: Record<string, boolean>) =>
  payload.create({
    collection: 'users',
    data: {
      email: `disclosure-${++sequence}@example.test`,
      password: 'Disclosure-test-1!',
      role: 'siteManager',
      features,
    } as never,
    overrideAccess: true,
  }) as Promise<User>

describe('Disclosure months with real Payload and MongoDB', () => {
  beforeAll(async () => {
    const mongo = await createTestMongoServer()
    stopMongo = mongo.stop
    process.env.MONGODB_URI = mongo.uri
    delete process.env.DATABASE_NAME
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 'localDisk'
    process.env.PAYLOAD_SECRET = 'isolated-disclosure-month-secret-32-characters'
    const { default: config } = await import('@/payload.config')
    payload = await getPayload({ config })
    await Promise.all(Object.values(payload.db.collections).map((model) => model.init()))

    admin = (await payload.create({
      collection: 'users',
      data: {
        email: 'disclosure-admin@example.test',
        password: 'Disclosure-test-1!',
        role: 'admin',
      } as never,
      overrideAccess: true,
    })) as User
    const dataset = await payload.create({
      collection: 'disclosure-datasets',
      data: { title: 'Institutional disclosures' },
      overrideAccess: true,
    })
    datasetID = dataset.id
    september = await payload.create({
      collection: 'disclosure-periods',
      data: {
        dataset: dataset.id,
        label: 'September 2026',
        asOf: '2026-09-30T06:30:00.000Z',
        academicSession: '2026-27',
        sourceNote: 'September monthly return',
        _status: 'published',
      },
      overrideAccess: true,
      user: admin,
    })
    const record = { dataset: dataset.id, period: september.id, section: 'statistics' as const }
    await payload.create({
      collection: 'disclosure-records',
      data: {
        ...record,
        groupKey: 'highlights',
        label: 'OPD attendance',
        sortOrder: 10,
        rowType: 'value',
        content: { valueState: 'provided', value: '41,250' },
        details: [{ label: 'Source', value: 'Medical records' }],
        sourceNote: 'Register page 4',
        _status: 'published',
      },
      overrideAccess: true,
      user: admin,
    })
    await payload.create({
      collection: 'disclosure-records',
      data: {
        ...record,
        section: 'courses',
        groupKey: 'programmes',
        label: 'MD General Medicine',
        sortOrder: 20,
        rowType: 'table',
        cells: [
          { key: 'programme', valueState: 'provided', value: 'MD General Medicine' },
          { key: 'admitted', valueState: 'notSupplied' },
        ],
        _status: 'published',
      },
      overrideAccess: true,
      user: admin,
    })
  }, 120_000)

  afterAll(async () => {
    await payload?.destroy()
    await stopMongo?.()
  }, 30_000)

  it('copies the month and every record as drafts, leaving the source month unchanged', async () => {
    const response = await copy(admin, 'October 2026')
    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result).toMatchObject({ records: 2 })
    expect(result.editURL).toContain(`/collections/disclosure-periods/${result.id}`)

    const october = await payload.findByID({
      collection: 'disclosure-periods',
      id: result.id,
      draft: true,
      depth: 0,
      overrideAccess: true,
    })
    expect(october).toMatchObject({
      label: 'October 2026',
      asOf: '2026-10-31T06:30:00.000Z',
      academicSession: '2026-27',
      sourceNote: 'September monthly return',
      dataset: datasetID,
      _status: 'draft',
    })

    const copies = await recordsOf(result.id)
    expect(copies.docs.map((doc) => doc._status)).toEqual(['draft', 'draft'])
    expect(copies.docs[0]).toMatchObject({
      label: 'OPD attendance',
      content: { valueState: 'provided', value: '41,250' },
      details: [{ label: 'Source', value: 'Medical records' }],
      sourceNote: 'Register page 4',
    })
    expect(copies.docs[1].cells).toMatchObject([
      { key: 'programme', valueState: 'provided', value: 'MD General Medicine' },
      { key: 'admitted', valueState: 'notSupplied' },
    ])

    const originals = await recordsOf(september.id)
    expect(originals.docs.map((doc) => doc._status)).toEqual(['published', 'published'])
    expect(originals.docs[0].details?.[0].id).not.toBe(copies.docs[0].details?.[0].id)

    // Copies are not public until the month is published.
    const publicRows = await payload.find({
      collection: 'disclosure-records',
      overrideAccess: false,
      where: { period: { equals: result.id } },
    })
    expect(publicRows.totalDocs).toBe(0)
  })

  it('refuses a second month with the same name', async () => {
    const response = await copy(admin, 'October 2026')
    expect(response.status).toBe(409)
    expect(await periodsNamed('October 2026')).toMatchObject({ totalDocs: 1 })
  })

  it.each([
    ['with', false],
    ['without', true],
  ])(
    'creates nothing when a record cannot be copied (%s transactions)',
    async (_, noTransactions) => {
      const begin = noTransactions
        ? vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
        : undefined
      const create = payload.create.bind(payload)
      const spy = vi.spyOn(payload, 'create').mockImplementation((async (args) => {
        if (
          args.collection === 'disclosure-records' &&
          (args.data as { sortOrder?: number }).sortOrder === 20
        ) {
          throw new Error('Simulated failure')
        }
        return create(args)
      }) as typeof payload.create)

      const response = await copy(admin, 'November 2026', '2026-11-30T06:30:00.000Z')
      spy.mockRestore()
      begin?.mockRestore()

      expect(response.status).toBe(500)
      expect(await periodsNamed('November 2026')).toMatchObject({ totalDocs: 0 })
      const all = await payload.count({ collection: 'disclosure-records', overrideAccess: true })
      expect(all.totalDocs).toBe(4)
    },
  )

  it('requires both disclosure features', async () => {
    expect((await copy(null, 'December 2026')).status).toBe(401)
    const periodsOnly = await siteManager({ disclosurePeriods: true })
    expect((await copy(periodsOnly, 'December 2026')).status).toBe(403)
    expect((await call(publishDisclosurePeriodEndpoint, september.id, periodsOnly)).status).toBe(
      403,
    )

    const editor = await siteManager({ disclosurePeriods: true, disclosureRecords: true })
    expect((await copy(editor, 'December 2026', '2026-12-31T06:30:00.000Z')).status).toBe(201)
  })

  it('publishes the month with every record that has unpublished changes', async () => {
    const { docs } = await payload.find({
      collection: 'disclosure-periods',
      draft: true,
      overrideAccess: true,
      where: { label: { equals: 'October 2026' } },
    })
    const october = docs[0]
    const [opd] = (await recordsOf(october.id)).docs
    await payload.update({
      collection: 'disclosure-records',
      id: opd.id,
      data: { content: { valueState: 'provided', value: '43,900' } },
      draft: true,
      overrideAccess: true,
      user: admin,
    })

    const response = await call(publishDisclosurePeriodEndpoint, october.id, admin)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ period: 'October 2026', published: 2, records: 2 })

    const publicRows = await payload.find({
      collection: 'disclosure-records',
      overrideAccess: false,
      sort: 'sortOrder',
      where: { period: { equals: october.id } },
    })
    expect(publicRows.docs.map((doc) => doc.content?.value)).toEqual(['43,900', undefined])

    const again = await call(publishDisclosurePeriodEndpoint, october.id, admin)
    expect(await again.json()).toMatchObject({ published: 0, records: 2 })
  })

  it('takes a new record’s dataset from its reporting period', async () => {
    const record = await payload.create({
      collection: 'disclosure-records',
      data: {
        period: september.id,
        section: 'hostel',
        groupKey: 'accommodation',
        label: 'Boys hostel',
        sortOrder: 30,
      },
      draft: true,
      overrideAccess: false,
      user: admin,
    })
    expect(record.dataset).toMatchObject({ id: datasetID })
  })
})

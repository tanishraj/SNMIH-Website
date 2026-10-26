/** Local-only, idempotent preview. Never uses the environment's database connection. */
import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { config as dotenv } from 'dotenv'
import { getPayload } from 'payload'
import { defaultSections } from '../src/blocks/DisclosureProforma/shared'

dotenv({ path: '.env' })
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/?directConnection=true'
process.env.DATABASE_NAME = 'snmih_disclosure_preview'
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
const context = { skipCacheRevalidation: true }
try {
  const source = JSON.parse(await readFile('scripts/disclosure-proforma-source.json', 'utf8'))
  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: 'disclosure-preview@example.test' } },
  })
  let user = existing.docs[0]
  if (!user) {
    const password = randomBytes(24).toString('base64url')
    user = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context,
      data: {
        email: 'disclosure-preview@example.test',
        password,
        role: 'admin',
        publicDisplayName: 'Local preview editor',
      },
    })
    await writeFile(
      '/tmp/snmih-disclosure-preview-credentials.json',
      JSON.stringify({ email: user.email, password }, null, 2),
      { mode: 0o600 },
    )
  }
  const existingDataset = await payload.find({
    collection: 'disclosure-datasets',
    overrideAccess: true,
    limit: 1,
    where: { title: { equals: 'SNMIH — September 2026 local preview' } },
  })
  const dataset =
    existingDataset.docs[0] ??
    (await payload.create({
      collection: 'disclosure-datasets',
      overrideAccess: true,
      user,
      context,
      data: { title: 'SNMIH — September 2026 local preview' },
    }))
  const existingPeriod = await payload.find({
    collection: 'disclosure-periods',
    overrideAccess: true,
    limit: 1,
    where: { and: [{ dataset: { equals: dataset.id } }, { label: { equals: 'September 2026' } }] },
  })
  const period =
    existingPeriod.docs[0] ??
    (await payload.create({
      collection: 'disclosure-periods',
      overrideAccess: true,
      user,
      context,
      data: {
        dataset: dataset.id,
        label: 'September 2026',
        asOf: '2026-09-30T00:00:00.000Z',
        sourceNote: 'User-supplied Pro forma 18.docx; reporting month confirmed by the user.',
        _status: 'published',
      },
    }))
  type Input = {
    section: 'institution' | 'statistics' | 'courses' | 'hostel'
    groupKey: string
    label: string
    value?: unknown
    cells?: { key: string; value: unknown }[]
  }
  const rows: Input[] = []
  const facts = (section: Input['section'], groupKey: string, values: [string, unknown][]) =>
    values.forEach(([label, value]) => rows.push({ section, groupKey, label, value }))
  const institution = source.institution
  facts('institution', 'profile', [
    ['Institution', institution.name],
    ['Government / Private', institution.ownership],
    ['Year of inception', institution.yearOfInception],
    ['Address', institution.address],
    ['Affiliating university', institution.universityName],
    ['University address', institution.universityAddress],
    ['Official website', institution.website],
    ['Recognition status (as supplied)', institution.recognitionStatusAsProvided],
  ])
  facts('institution', 'leadership', [
    ['Dean / Principal / Director', institution.leadershipName],
    ['Mobile', institution.leadershipPhone],
    ['Email', institution.leadershipEmail],
  ])
  facts('institution', 'hospital', [
    ['Attached hospital', institution.hospitalName],
    ['Hospital registration date', institution.hospitalRegistrationDate],
    ['Beds', institution.beds],
    ['Emergency beds', institution.emergencyBeds],
    ['First MBBS LoP', '1 November 2021'],
    ['Seats in first LoP', institution.firstLoPSeats],
  ])
  const m = source.monthlyStatistics[0]
  facts('statistics', 'highlights', [
    ['Outpatient visits', m.outpatients.toLocaleString('en-IN')],
    ['Inpatients', m.inpatients.toLocaleString('en-IN')],
    ['Births reported', m.births],
  ])
  facts('statistics', 'monthly', [
    ['Deaths reported', m.deaths],
    ['Grievances reported', m.grievances],
  ])
  facts('courses', 'intake', [
    ['MBBS permitted intake', source.sessionPermission.mbbsPermittedIntake],
    ['PG permitted intake', source.sessionPermission.pgPermittedIntake],
    ['PG admissions — listed courses', source.sessionPermission.pgAdmittedFromListedCourses],
  ])
  for (const course of source.pgCourses)
    rows.push({
      section: 'courses',
      groupKey: 'programmes',
      label: course.name,
      cells: [
        { key: 'programme', value: course.name },
        { key: 'commencement', value: course.commencementSession },
        { key: 'pursuing', value: course.pursuing },
        { key: 'admitted', value: course.admitted },
      ],
    })
  facts('courses', 'session', [
    ['Data as of', 'September 2026'],
    ['Current academic session', null],
    ['Course commencement', '2025–26 (LoP)'],
    ['MBBS students admitted', null],
    ['DM / MCh', 'Not applicable'],
  ])
  for (const hostel of source.hostels)
    rows.push({
      section: 'hostel',
      groupKey: 'accommodation',
      label: hostel.name,
      cells: [
        { key: 'name', value: hostel.name },
        { key: 'rooms', value: hostel.rooms },
        { key: 'students', value: hostel.studentsAccommodated },
      ],
    })
  facts('hostel', 'grievance', [
    ['PIO / CPIO name', null],
    ['Office address', null],
    ['Phone', null],
    ['Email', null],
  ])
  facts('hostel', 'reporting', [
    ['Birth reporting authority', source.statutoryReporting[0].authority],
    ['Death reporting authority', source.statutoryReporting[1].authority],
    ['Reporting portal', source.statutoryReporting[0].url],
    ['Authority postal code', null],
  ])
  let created = 0
  for (const [sortOrder, row] of rows.entries()) {
    const prior = await payload.find({
      collection: 'disclosure-records',
      overrideAccess: true,
      limit: 1,
      where: {
        and: [
          { dataset: { equals: dataset.id } },
          { period: { equals: period.id } },
          { section: { equals: row.section } },
          { groupKey: { equals: row.groupKey } },
          { label: { equals: row.label } },
        ],
      },
    })
    if (prior.docs.length) continue
    await payload.create({
      collection: 'disclosure-records',
      overrideAccess: true,
      user,
      context,
      data: {
        dataset: dataset.id,
        period: period.id,
        section: row.section,
        groupKey: row.groupKey,
        label: row.label,
        sortOrder,
        rowType: row.cells ? 'table' : 'value',
        content: row.cells
          ? undefined
          : {
              value: row.value == null ? null : String(row.value),
              valueState: row.value == null ? 'notSupplied' : 'provided',
            },
        cells: row.cells?.map((cell) => ({
          key: cell.key,
          value: cell.value == null ? null : String(cell.value),
          valueState: cell.value == null ? 'notSupplied' : 'provided',
        })),
        _status: 'published',
        sourceNote: 'Pro forma 18.docx — September 2026',
      },
    })
    created++
  }
  const priorPage = await payload.find({
    collection: 'pages',
    overrideAccess: true,
    limit: 1,
    where: { slug: { equals: 'disclosure-preview' } },
  })
  if (!priorPage.docs.length)
    await payload.create({
      collection: 'pages',
      overrideAccess: true,
      user,
      context,
      data: {
        title: 'Disclosure Proforma',
        slug: 'disclosure-preview',
        _status: 'published',
        layout: [
          {
            blockType: 'pageHeader',
            title: 'Disclosure Proforma',
            topContent: 'eyebrow',
            eyebrow: 'Regulatory information',
            variant: 'minimal',
            appearance: { background: 'none', border: 'none' },
          },
          {
            blockType: 'breadcrumb',
            breadcrumbMode: 'automatic',
            separator: 'chevron',
            alignment: 'left',
            size: 'default',
            sectionPadding: 'compact',
            appearance: { background: 'none', border: 'none' },
          },
          {
            blockType: 'disclosureProforma',
            appearance: { background: 'none', border: 'none' },
            dataset: dataset.id,
            title: 'Institutional disclosures',
            description: 'Explore current information and previous reporting periods.',
            sections: defaultSections,
            defaultSection: 'statistics',
            itemsPerPage: '5',
            sidebarWidth: 'wide',
            archiveNote: 'Previous reporting periods remain available within each section.',
          },
        ],
      },
    })
  // Integration checks use a dedicated draft-only row, never supplied source content.
  const test = await payload.create({
    collection: 'disclosure-records',
    overrideAccess: true,
    user,
    context,
    data: {
      dataset: dataset.id,
      period: period.id,
      section: 'statistics',
      groupKey: 'verification-only',
      label: 'Local draft isolation check',
      sortOrder: 0,
      _status: 'published',
      content: { value: '0' },
    },
  })
  const stamp = await payload.findByID({
    collection: 'disclosure-datasets',
    id: dataset.id,
    depth: 0,
  })
  await payload.update({
    collection: 'disclosure-records',
    id: test.id,
    draft: true,
    overrideAccess: true,
    user,
    context,
    data: { content: { value: '1' } },
  })
  const afterDraft = await payload.findByID({
    collection: 'disclosure-datasets',
    id: dataset.id,
    depth: 0,
  })
  const live = await payload.findByID({
    collection: 'disclosure-records',
    id: test.id,
    draft: false,
    depth: 0,
  })
  if (stamp.publicUpdatedAt !== afterDraft.publicUpdatedAt || live.content?.value !== '0')
    throw new Error('Draft isolation failed.')
  await payload.update({
    collection: 'disclosure-records',
    id: test.id,
    overrideAccess: true,
    user,
    context,
    data: { _status: 'draft' },
  })
  const afterUnpublish = await payload.findByID({
    collection: 'disclosure-datasets',
    id: dataset.id,
    depth: 0,
  })
  if (afterUnpublish.publicUpdatedAt === afterDraft.publicUpdatedAt)
    throw new Error('Unpublication did not update public metadata.')
  const accessPeriod = await payload.create({
    collection: 'disclosure-periods',
    overrideAccess: true,
    user,
    context,
    data: {
      dataset: dataset.id,
      label: 'Local access verification',
      asOf: '1970-01-01T00:00:00.000Z',
      _status: 'published',
    },
  })
  const accessRecord = await payload.create({
    collection: 'disclosure-records',
    overrideAccess: true,
    user,
    context,
    data: {
      dataset: dataset.id,
      period: accessPeriod.id,
      section: 'statistics',
      groupKey: 'verification-only',
      label: 'Hidden period access check',
      sortOrder: 0,
      _status: 'published',
    },
  })
  await payload.update({
    collection: 'disclosure-periods',
    id: accessPeriod.id,
    overrideAccess: true,
    user,
    context,
    data: { _status: 'draft' },
  })
  const publicRead = await payload.find({
    collection: 'disclosure-records',
    overrideAccess: false,
    draft: false,
    limit: 1,
    where: { id: { equals: accessRecord.id } },
  })
  if (publicRead.totalDocs !== 0)
    throw new Error('Unpublished period exposed a record through the public collection API.')
  console.log(
    JSON.stringify({
      database: 'snmih_disclosure_preview',
      createdRecords: created,
      dataset: dataset.id,
      period: period.id,
      draftIsolation: 'passed',
      unpublication: 'passed',
      unpublishedPeriodAccess: 'passed',
      previewPath: '/disclosure-preview',
    }),
  )
} finally {
  await payload.destroy()
}

process.exit(0)

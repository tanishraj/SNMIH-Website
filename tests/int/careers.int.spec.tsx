import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { blockThumbnailDefinitions } from '@/block-thumbnails/definitions'
import { blockThumbnailFixtures } from '@/block-thumbnails/fixtures'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
import {
  CareersBlockComponent,
  resolveCareersOpenings,
  type CareersGroup,
  type CareersOpening,
} from '@/blocks/Careers/Component'
import { CareersBlock } from '@/blocks/Careers/config'

const groups: CareersGroup[] = [
  { id: 'g-residents', name: 'Residents' },
  { id: 'g-faculty', name: 'Faculty' },
]

const openings: CareersOpening[] = [
  {
    actions: [
      { label: 'View notification', linkType: 'custom', url: '/files/fac-41.pdf', mode: 'link' },
    ],
    applyBy: '2026-11-15T12:00:00.000Z',
    department: 'General Medicine',
    employmentType: 'regular',
    group: 'g-faculty',
    id: 'a',
    location: 'Saharsa campus',
    positions: 1,
    publishedOn: '2026-10-12T12:00:00.000Z',
    reference: 'SNMIH/FAC/2026/41',
    status: 'open',
    title: 'Professor – General Medicine',
  },
  {
    applyBy: '2026-11-10T12:00:00.000Z',
    department: 'Paediatrics',
    employmentNote: '3 years',
    employmentType: 'contract',
    group: 'residents',
    id: 'b',
    positions: 3,
    status: 'open',
    title: 'Senior Resident – Paediatrics',
  },
  { group: 'g-faculty', id: 'c', status: 'closed', title: 'Tutor – Biochemistry' },
  { group: 'g-deleted', id: 'd', status: 'open', title: 'Medical Records Officer' },
]

const render = (props: Partial<Parameters<typeof CareersBlockComponent>[0]> = {}) =>
  renderToStaticMarkup(
    <CareersBlockComponent
      description="Current openings."
      eyebrow="Careers at SNMIH"
      groups={groups}
      openings={openings}
      title="Work with us"
      {...props}
    />,
  )

describe('Careers block', () => {
  it('is registered for Pages and Reusable Sections with a thumbnail and fixture', () => {
    expect(CareersBlock.slug).toBe('careers')
    expect(CareersBlock.interfaceName).toBe('CareersBlock')
    expect(pageBuilderBlocks.some((block) => block.slug === 'careers')).toBe(true)
    expect(reusableSectionBuilderBlocks.some((block) => block.slug === 'careers')).toBe(true)
    expect(blockThumbnailDefinitions.some((definition) => definition.slug === 'careers')).toBe(true)
    expect(blockThumbnailFixtures.careers).toBeTruthy()
  })

  it('offers the four layouts and keeps closed posts out of the list', () => {
    const tabs = CareersBlock.fields.find((field) => field.type === 'tabs')
    const content = tabs?.type === 'tabs' ? tabs.tabs[0].fields : []
    const names = content.map((field) => ('name' in field ? field.name : field.type))
    expect(names.indexOf('groups')).toBeLessThan(names.indexOf('openings'))
    const theme = tabs?.type === 'tabs' ? tabs.tabs[1].fields : []
    const layout = theme.find((field) => 'name' in field && field.name === 'layout')
    expect(
      layout?.type === 'select' && layout.options.map((o) => (typeof o === 'string' ? o : o.value)),
    ).toEqual(['notice', 'register', 'ledger', 'departments'])

    const resolved = resolveCareersOpenings(openings, groups)
    expect(resolved.map((opening) => opening.title)).toEqual([
      'Professor – General Medicine',
      'Senior Resident – Paediatrics',
      'Medical Records Officer',
    ])
    expect(resolved[1]).toMatchObject({ employment: 'Contract · 3 years', positions: '3 posts' })
    // Matched by group id, by legacy group name, and an id whose group was deleted.
    expect(resolved.map((opening) => opening.group)).toEqual([
      'Faculty',
      'Residents',
      'Other openings',
    ])
    expect(resolved[0]).toMatchObject({ applyBy: 'Nov 15, 2026', posted: 'Oct 12, 2026' })
  })

  it('groups rows under numbered headings in the configured group order', () => {
    const html = render({ layout: 'register' })
    expect(html).toContain('data-careers-layout="register"')
    expect(html).toContain('>01</span>Residents')
    expect(html).toContain('>02</span>Faculty')
    expect(html).toContain('>03</span>Other openings')
    expect(html).toContain('3 open positions')
    expect(html).toContain('General Medicine · Regular · Posted Oct 12, 2026')
    expect(html).toMatch(
      /aria-label="Professor – General Medicine: View notification"[^>]*href="\/files\/fac-41\.pdf"/,
    )
    expect(html).not.toContain('Tutor – Biochemistry')

    const ledger = render({ layout: 'ledger', showGroupNumbers: false })
    expect(ledger).not.toMatch(/max-w-[45]xl" /)
    expect(ledger).not.toContain('>01</span>')
    expect(ledger).not.toContain('Saharsa campus')
  })

  it('renders the departments column and the centred notice board', () => {
    const departments = render({ layout: 'departments' })
    expect(departments).toContain('md:grid-cols-[16rem_minmax(0,1fr)]')
    expect(departments).toContain('aria-label="Residents"')

    const notice = render({ layout: 'notice', contentAlignment: 'left' })
    expect(notice).toContain('mx-auto items-center text-center')
    expect(notice).not.toContain('<ul class="mx-auto')
    expect(notice).toContain('>General Medicine</span>')
    expect(notice).toContain('SNMIH/FAC/2026/41 · Posted Oct 12, 2026')
    expect(notice).not.toContain('>01</span>')
  })

  it('shows the empty message when nothing is open and links addresses in the note', () => {
    const empty = render({
      emptyMessage: 'No vacancies right now.',
      note: 'Send your CV to hr@snmih.in.',
      openings: [{ status: 'closed', title: 'Closed post' }],
    })
    expect(empty).toContain('data-careers-empty="true"')
    expect(empty).toContain('No vacancies right now.')
    expect(empty).toContain('href="mailto:hr@snmih.in"')
    expect(empty).not.toContain('open positions')
  })
})

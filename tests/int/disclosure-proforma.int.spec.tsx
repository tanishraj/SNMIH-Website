import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DisclosureProformaBlock, uniqueKeys } from '@/blocks/DisclosureProforma/config'
import { DisclosurePresentation } from '@/blocks/DisclosureProforma/Presentation'
import { parseDisclosureQuery } from '@/blocks/DisclosureProforma/request'
import { defaultSections, displayValue, normalizeLimit } from '@/blocks/DisclosureProforma/shared'
import { DisclosureDatasets, DisclosurePeriods, DisclosureRecords } from '@/collections/Disclosure'
import {
  editorName,
  stampDisclosureLayout,
  stampDisclosure,
  touchDisclosureDataset,
} from '@/collections/Disclosure/hooks'
import { canReadFeature, hasFeature } from '@/access/featureAccess'

vi.mock('@/hooks/revalidateCmsContent', () => ({ revalidatePagesCache: vi.fn(({ doc }) => doc) }))
const parse = (extra = '') =>
  parseDisclosureQuery(
    new URLSearchParams('dataset=abc&section=statistics&groups=highlights,monthly' + extra),
  )

describe('Disclosure Proforma', () => {
  it('keeps unknown, zero and not-applicable values distinct', () => {
    expect(displayValue(null)).toBe('Not supplied')
    expect(displayValue('0')).toBe('0')
    expect(displayValue('0', 'notSupplied')).toBe('Not supplied')
    expect(displayValue('', 'notApplicable')).toBe('Not applicable')
  })
  it('bounds and validates all public query parameters', () => {
    expect(parse().limit).toBe(10)
    for (const invalid of [
      '&limit=1000',
      '&page=-1',
      '&page=1.1',
      '&draft=yes',
      '&periodPage=0',
      '&q=' + 'a'.repeat(101),
    ])
      expect(() => parse(invalid)).toThrow()
    expect(() =>
      parseDisclosureQuery(new URLSearchParams('dataset=abc&section=users&groups=highlights')),
    ).toThrow()
    expect(() =>
      parseDisclosureQuery(new URLSearchParams('dataset=abc&section=statistics&groups=x,x')),
    ).toThrow()
  })
  it('uses the established block tabs and retains records independently of Pages', () => {
    const tabs = DisclosureProformaBlock.fields.find((field) => field.type === 'tabs')
    expect(tabs?.type === 'tabs' && tabs.tabs.map((tab) => tab.label)).toEqual([
      'Content',
      'Theme Settings',
    ])
    for (const collection of [DisclosureDatasets, DisclosurePeriods, DisclosureRecords]) {
      expect(collection.trash).toBe(false)
      expect(collection.access?.delete?.({} as never)).toBe(false)
    }
    expect(DisclosureRecords.versions).toEqual({ drafts: true, maxPerDoc: 0 })
    expect(uniqueKeys([{ key: 'a' }, { key: 'a' }], {} as never)).toBeTypeOf('string')
  })
  it('allows Page editors to preview dependencies without granting mutation', () => {
    const user = { role: 'siteManager', features: { pages: true } }
    expect(canReadFeature(user, 'disclosureRecords')).toBe(true)
    expect(hasFeature(user, 'disclosureRecords')).toBe(false)
    expect(canReadFeature({ role: 'siteManager' }, 'disclosureRecords')).toBe(false)
  })
  it('stamps published layout saves, leaves drafts untouched, and never falls back to email', () => {
    const data = {
      _status: 'published',
      layout: [{ blockType: 'disclosureProforma' }, { blockType: 'pageHeader' }],
    }
    const result = stampDisclosureLayout(data, null, {
      publicDisplayName: 'Academic Office',
      email: 'private@example.com',
    })
    expect((result.layout as Record<string, unknown>[])[0]).toMatchObject({
      publicUpdatedBy: 'Academic Office',
    })
    expect((result.layout as Record<string, unknown>[])[0]).toHaveProperty('publicUpdatedAt')
    expect((result.layout as Record<string, unknown>[])[1]).toEqual(data.layout[1])
    const draft = { ...data, _status: 'draft' }
    expect(stampDisclosureLayout(draft, data, null)).toBe(draft)
    expect(editorName({ email: 'private@example.com' })).toBe('Editorial team')
    const partial = stampDisclosureLayout({ title: 'Updated title' }, data, {
      publicDisplayName: 'Records Office',
    })
    expect((partial.layout as Record<string, unknown>[])[0]).toMatchObject({
      publicUpdatedBy: 'Records Office',
    })
  })
  it('stamps edits already published, not only first publication', async () => {
    const result = await stampDisclosure({
      data: { _status: 'published' },
      originalDoc: { _status: 'published', publicUpdatedAt: '2020-01-01' },
      req: { user: { publicDisplayName: 'Records Office' } },
    } as never)
    expect(result.publicUpdatedBy).toBe('Records Office')
    expect(result.publicUpdatedAt).not.toBe('2020-01-01')
  })
  it('does not advance public revision for a saved draft over a published record', async () => {
    const update = vi.fn()
    await touchDisclosureDataset({
      doc: { id: 'row', dataset: 'dataset', _status: 'draft' },
      previousDoc: { _status: 'published' },
      collection: { slug: 'disclosure-records' },
      req: { payload: { findByID: vi.fn().mockResolvedValue({ _status: 'published' }), update } },
      context: {},
    } as never)
    expect(update).not.toHaveBeenCalled()
  })
  it('advances public revision on unpublication and passes the same transaction request', async () => {
    const update = vi.fn()
    const req = {
      user: { publicDisplayName: 'Records Office' },
      payload: {
        findByID: vi
          .fn()
          .mockResolvedValueOnce({ _status: 'draft' })
          .mockResolvedValueOnce({ _status: 'published' }),
        update,
      },
    }
    await touchDisclosureDataset({
      doc: { id: 'row', dataset: 'dataset', period: 'period', _status: 'draft' },
      previousDoc: { _status: 'published' },
      collection: { slug: 'disclosure-records' },
      req,
      context: {},
    } as never)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dataset',
        req,
        data: expect.objectContaining({ publicUpdatedBy: 'Records Office' }),
      }),
    )
  })
  it('renders actual statistics, configured groups and honest missing values', () => {
    const html = renderToStaticMarkup(
      <DisclosurePresentation
        dataset="fixture"
        title="Institutional disclosures"
        sections={defaultSections}
        defaultSection="statistics"
        staticPreview
        initial={{
          dataset: 'fixture',
          period: 'sep',
          periods: [{ id: 'sep', label: 'September 2026' }],
          periodPage: 1,
          hasMorePeriods: false,
          groups: {
            highlights: {
              rows: [{ id: 'opd', label: 'Outpatients', value: '58,245' }],
              page: 1,
              total: 1,
              totalPages: 1,
            },
            monthly: {
              rows: [{ id: 'grievance', label: 'Grievances', value: null }],
              page: 1,
              total: 1,
              totalPages: 1,
            },
          },
        }}
      />,
    )
    expect(html).toContain('58,245')
    expect(html).toContain('September 2026')
    expect(html).toContain('Not supplied')
    expect(html).not.toContain('Annual overview')
    expect(html).not.toContain('26 October 2026')
  })
  const renderStatistics = (extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      <DisclosurePresentation
        dataset="fixture"
        sections={defaultSections}
        defaultSection="statistics"
        staticPreview
        {...extra}
        initial={{
          dataset: 'fixture',
          period: 'sep',
          periods: [{ id: 'sep', label: 'September 2026' }],
          periodPage: 1,
          hasMorePeriods: false,
          groups: {
            monthly: {
              rows: [
                { id: 'grievance', label: 'Grievances', value: null },
                { id: 'dm', label: 'DM / MCh', value: null, valueState: 'notApplicable' },
              ],
              page: 1,
              total: 2,
              totalPages: 1,
            },
          },
        }}
      />,
    )
  it('keeps the header to the update stamp and names the period on the picker', () => {
    const pending = renderStatistics()
    expect(pending).toContain('Publication pending')
    expect(pending).not.toContain('Data as of')
    expect(pending).not.toContain('Updated by')
    expect(pending).toContain('aria-label="Reporting period: September 2026"')
    const stamped = renderStatistics({
      publicUpdatedAt: '2026-10-27T10:15:00.000Z',
      publicUpdatedBy: 'Records Office',
    })
    expect(stamped).toMatch(/Updated ·.<time[^>]*>27 Oct 2026<\/time>/)
    expect(stamped).not.toMatch(/\d{1,2}:\d{2}\s?[ap]m/i)
    expect(stamped).not.toContain('Records Office')
  })
  it('numbers table rows across pages and badges only supplied figures', () => {
    const html = renderToStaticMarkup(
      <DisclosurePresentation
        dataset="fixture"
        sections={defaultSections}
        defaultSection="courses"
        itemsPerPage="5"
        staticPreview
        initial={{
          dataset: 'fixture',
          period: 'sep',
          periods: [{ id: 'sep', label: 'September 2026' }],
          periodPage: 1,
          hasMorePeriods: false,
          groups: {
            programmes: {
              rows: [
                {
                  id: 'md',
                  label: 'MD- Pathology',
                  cells: [
                    { key: 'programme', value: 'MD- Pathology' },
                    { key: 'pursuing', value: '4' },
                    { key: 'admitted', value: null },
                  ],
                },
              ],
              page: 2,
              total: 6,
              totalPages: 2,
            },
          },
        }}
      />,
    )
    expect(html).toContain('>06</td>')
    expect(html).toMatch(/rounded-full bg-current\/8[^>]*>4</)
    expect(html).toContain('border-dashed border-current/45')
    // Longer tables page inside the panel: a count in the header and numbered pages in the footer.
    expect(html).toContain('>6 rows<')
    expect(html).toContain('aria-label="Pages: Postgraduate programmes"')
    expect(html).toMatch(/aria-current="page"[^>]*>2</)
    expect(html).toContain('Showing <span')
    expect(html).not.toContain('Load more')
  })
  it('caps every table at ten rows and falls back for older stored sizes', () => {
    expect(normalizeLimit('50')).toBe(10)
    expect(normalizeLimit('20')).toBe(10)
    expect(normalizeLimit('5')).toBe(5)
    expect(() => parse('&limit=20')).toThrow()
    expect(parse('&limit=5').limit).toBe(5)
  })
  it('wraps each group in a titled panel and keeps row details behind a toggle', () => {
    const html = renderStatistics()
    expect(html).toContain('<section aria-label="Monthly records"')
    expect(html).toContain('>2 items<')
    const table = renderToStaticMarkup(
      <DisclosurePresentation
        dataset="fixture"
        sections={defaultSections}
        defaultSection="faculty"
        staticPreview
        initial={{
          dataset: 'fixture',
          period: 'sep',
          periods: [{ id: 'sep', label: 'September 2026' }],
          periodPage: 1,
          hasMorePeriods: false,
          groups: {
            register: {
              rows: [
                {
                  id: 'f1',
                  label: 'Dr. One',
                  cells: [{ key: 'name', value: 'Dr. One' }],
                  details: [{ label: 'Date of joining', value: '01 Aug 2016' }],
                },
                { id: 'f2', label: 'Dr. Two', cells: [{ key: 'name', value: 'Dr. Two' }] },
              ],
              page: 1,
              total: 2,
              totalPages: 1,
            },
          },
        }}
      />,
    )
    expect(table).toContain('aria-label="Show details: Dr. One"')
    expect(table).toContain('aria-expanded="false"')
    expect(table).not.toContain('Date of joining')
    expect(table).not.toContain('Show details: Dr. Two')
  })
  it('renders each configured missing-value style without inventing values', () => {
    const chip = renderStatistics()
    expect(chip).toContain('border-dashed')
    expect(chip).toContain('Not applicable')
    const footnote = renderStatistics({ missingValueStyle: 'footnote' })
    expect(footnote).toContain('<span class="sr-only">Not supplied</span>')
    expect(footnote).toContain('Not supplied for September 2026.')
    expect(footnote).toContain('Not applicable')
    const text = renderStatistics({ missingValueStyle: 'text' })
    expect(text).not.toContain('border-dashed')
    expect(text).not.toContain('for September 2026.')
  })
  it('removes hidden sections from the sidebar and labels the setting plainly', () => {
    const sections = defaultSections.map((s) =>
      s.key === 'surgeries' ? { ...s, enabled: false } : s,
    )
    const html = renderStatistics({ sections })
    expect(html).not.toContain('>Surgeries<')
    expect(html).toContain('>04</span>Departments &amp; faculty')
    const tabs = DisclosureProformaBlock.fields.find((field) => field.type === 'tabs')
    const content = tabs?.type === 'tabs' ? tabs.tabs[0].fields : []
    const sectionsField = content.find((f) => 'name' in f && f.name === 'sections')
    const enabled =
      sectionsField?.type === 'array'
        ? sectionsField.fields.find((f) => 'name' in f && f.name === 'enabled')
        : undefined
    expect(enabled && 'label' in enabled && enabled.label).toBe('Show in sidebar')
    const rowLabel =
      sectionsField?.type === 'array' ? sectionsField.admin?.components?.RowLabel : undefined
    expect(String(rowLabel)).toContain('DisclosureSectionRowLabel')
  })
  it('lets editors hide section numbers', () => {
    expect(renderStatistics()).toContain('>02</span>')
    expect(renderStatistics({ showSectionNumbers: false })).not.toContain('>02</span>')
  })
})

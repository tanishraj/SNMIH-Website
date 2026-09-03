import { readFileSync } from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AcademicProgrammesBlockComponent } from '@/blocks/AcademicProgrammes/Component'
import { AcademicProgrammesBlock } from '@/blocks/AcademicProgrammes/config'

type NamedField = {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
  }
  defaultValue?: unknown
  fields?: NamedField[]
  maxRows?: number
  name?: string
  options?: Array<{ value: string }>
  required?: boolean
  tabs?: Array<{ fields: NamedField[]; label: string }>
  type?: string
}

const findNamedField = (fields: NamedField[], name: string): NamedField | undefined => {
  for (const field of fields) {
    if (field.name === name) return field

    const nested = field.fields ?? field.tabs?.flatMap((tab) => tab.fields) ?? []
    const match = findNamedField(nested, name)
    if (match) return match
  }

  return undefined
}

describe('Academic Programmes block', () => {
  const generatedTypes = readFileSync(path.resolve(process.cwd(), 'src/payload-types.ts'), 'utf8')

  it('keeps content and theme controls aligned with editorial blocks', () => {
    const tabs = AcademicProgrammesBlock.fields[0] as NamedField
    const fields = tabs.tabs?.flatMap((tab) => tab.fields) ?? []

    expect(AcademicProgrammesBlock).toMatchObject({
      interfaceName: 'AcademicProgrammesBlock',
      slug: 'academicProgrammes',
    })
    expect(tabs.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(findNamedField(fields, 'programmes')).toMatchObject({
      maxRows: 24,
      minRows: 1,
      required: true,
      type: 'array',
    })
    expect(findNamedField(fields, 'image')?.required).not.toBe(true)
    expect(findNamedField(fields, 'badge')).toMatchObject({ type: 'text' })
    expect(findNamedField(fields, 'durationLabel')).toMatchObject({
      defaultValue: 'Duration',
      type: 'text',
    })
    expect(findNamedField(fields, 'duration')).toMatchObject({ type: 'text' })
    expect(findNamedField(fields, 'intakeLabel')).toMatchObject({
      defaultValue: 'Intake',
      type: 'text',
    })
    expect(findNamedField(fields, 'intake')).toMatchObject({ type: 'text' })
    expect(findNamedField(fields, 'viewMode')).toMatchObject({
      defaultValue: 'grid',
      required: true,
      type: 'select',
    })
    expect(findNamedField(fields, 'viewMode')?.options?.map((option) => option.value)).toEqual([
      'grid',
      'list',
      'detailedCards',
    ])
    const programmeIcon = findNamedField(fields, 'icon')
    const facts = findNamedField(fields, 'facts')
    const factIcon = findNamedField(facts?.fields ?? [], 'icon')

    expect(programmeIcon).toMatchObject({ type: 'text' })
    expect(facts).toMatchObject({ maxRows: 4, type: 'array' })
    expect(factIcon).toMatchObject({ type: 'text' })
    expect(findNamedField(facts?.fields ?? [], 'label')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(findNamedField(facts?.fields ?? [], 'value')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(findNamedField(fields, 'metadataPosition')).toMatchObject({
      defaultValue: 'flow',
      required: true,
      type: 'select',
    })
    expect(
      findNamedField(fields, 'metadataPosition')?.options?.map((option) => option.value),
    ).toEqual(['flow', 'bottom'])
    expect(findNamedField(fields, 'showFilter')).toMatchObject({
      defaultValue: false,
      type: 'checkbox',
    })
    expect(findNamedField(fields, 'headerLayout')).toMatchObject({
      defaultValue: 'split',
      required: true,
      type: 'select',
    })
    expect(findNamedField(fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      required: true,
      type: 'select',
    })
    expect(
      findNamedField(fields, 'contentAlignment')?.options?.map((option) => option.value),
    ).toEqual(['left', 'center', 'right'])
    expect(findNamedField(fields, 'columns')?.options?.map((option) => option.value)).toEqual([
      '2',
      '3',
      '4',
    ])
    expect(findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'grid' })).toBe(
      true,
    )
    expect(
      findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'detailedCards' }),
    ).toBe(true)
    expect(findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'list' })).toBe(
      false,
    )
    expect(
      findNamedField(fields, 'metadataPosition')?.admin?.condition?.({}, { viewMode: 'grid' }),
    ).toBe(true)
    expect(
      findNamedField(fields, 'metadataPosition')?.admin?.condition?.({}, { viewMode: 'list' }),
    ).toBe(true)
    expect(
      findNamedField(fields, 'metadataPosition')?.admin?.condition?.(
        {},
        { viewMode: 'detailedCards' },
      ),
    ).toBe(false)
    expect(findNamedField(fields, 'ctaLabel')).toBeDefined()
    expect(findNamedField(fields, 'actionMode')).toBeUndefined()
    expect(findNamedField(fields, 'actionVariant')).toBeUndefined()
    expect(findNamedField(fields, 'featureFirstProgramme')).toBeUndefined()
    expect(findNamedField(fields, 'descriptionPosition')).toMatchObject({
      defaultValue: 'side',
      required: true,
      type: 'select',
    })
    expect(findNamedField(fields, 'sideContentAlignment')).toMatchObject({
      defaultValue: 'bottom',
      required: true,
      type: 'select',
    })
  })

  it('keeps generated types aligned with Detailed Cards and Study Pathways removal', () => {
    expect(generatedTypes).toContain("viewMode: 'grid' | 'list' | 'detailedCards'")
    expect(generatedTypes).toContain('facts?:')
    expect(generatedTypes).not.toContain('export interface StudyPathwaysBlock')
    expect(generatedTypes).not.toContain('studyPathways?:')
  })

  it('renders the editorial cards with shared typography, tall media, and ruled links', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        accentTitle="in medicine."
        appearance={{ background: 'subtle', border: 'none' }}
        description="Programmes designed for clinical confidence."
        eyebrow="Academic programmes"
        programmes={[
          {
            badge: 'Clinical priority',
            ctaLabel: 'Explore MBBS',
            description: 'Competency-based education and clinical exposure.',
            duration: '4.5 years',
            eyebrow: 'Undergraduate',
            image: { alt: 'Anatomy teaching model', url: '/media/anatomy.jpg' },
            intake: '150 seats',
            linkType: 'custom',
            title: 'MBBS',
            url: '/programmes/mbbs',
          },
        ]}
        title="Begin your journey"
      />,
    )

    expect(html).toContain('data-academic-programmes="true"')
    expect(html).toContain('data-academic-programmes-view="grid"')
    expect(html).toContain('data-academic-programmes-header="split"')
    const splitHeaderClasses =
      html
        .match(/<header class="([^"]+)" data-academic-programmes-header="split">/)?.[1]
        ?.split(' ') ?? []
    expect(splitHeaderClasses).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
    expect(splitHeaderClasses).not.toContain('w-full')
    expect(splitHeaderClasses).not.toContain('max-w-3xl')
    expect(splitHeaderClasses).not.toContain('mr-auto')
    expect(splitHeaderClasses).not.toContain('mx-auto')
    expect(splitHeaderClasses).not.toContain('ml-auto')
    expect(html).toContain('Begin your journey')
    expect(html).toContain('in medicine.')
    expect(html).toContain('Clinical priority')
    expect(html).toContain('4.5 years')
    expect(html).toContain('150 seats')
    expect(html).toContain('href="/programmes/mbbs"')
    expect(html).toContain('text-3xl')
    expect(html).toContain('h-64')
    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('border-t')
    expect(html).toContain('data-academic-programme-link="true"')
    expect(html).toContain('data-academic-programme-action="ruled"')
    expect(html).toContain('data-academic-programme-image="true"')
    expect(html).toContain('w-full items-center justify-between')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('motion-safe:transition-transform')
    expect(html).not.toContain('text-success')
  })

  it.each([
    ['left', 'mr-auto'],
    ['center', 'mx-auto'],
    ['right', 'ml-auto'],
  ] as const)(
    'positions a %s-aligned stacked header across the full container',
    (alignment, outerClass) => {
      const html = renderToStaticMarkup(
        <AcademicProgrammesBlockComponent
          contentAlignment={alignment}
          description="Programmes designed for clinical confidence."
          headerLayout="stacked"
          programmes={[
            {
              image: { alt: 'Anatomy teaching model', url: '/media/anatomy.jpg' },
              title: 'MBBS',
            },
          ]}
          title="Begin your journey"
        />,
      )
      const headerClasses =
        html
          .match(/<header class="([^"]+)" data-academic-programmes-header="stacked">/)?.[1]
          ?.split(' ') ?? []

      expect(headerClasses).toEqual(
        expect.arrayContaining(['grid', 'gap-6', 'w-full', 'max-w-3xl', outerClass]),
      )
      expect(html).toContain(`data-content-alignment="${alignment}"`)
      if (alignment === 'center') {
        expect(html).toContain('mx-auto items-center text-center')
      }
    },
  )

  it('moves the description under the title and aligns right-column actions', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        actions={[
          {
            label: 'View all programmes',
            linkType: 'custom',
            url: '/programmes',
          },
        ]}
        description="Programmes designed for clinical confidence."
        descriptionPosition="underTitle"
        programmes={[
          {
            image: { alt: 'Anatomy teaching model', url: '/media/anatomy.jpg' },
            title: 'MBBS',
          },
        ]}
        sideContentAlignment="top"
        title="Begin your journey"
      />,
    )

    expect(html).toContain('data-academic-programmes-side-alignment="top"')
    expect(html).toContain('View all programmes')
    expect(html).toContain('lg:self-start')
    expect(html).toContain('ml-auto w-full items-end text-right')
  })

  it('aligns section and footer actions inside the padded container', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        contentAlignment="right"
        footerActions={[
          {
            label: 'View all programmes',
            linkType: 'custom',
            url: '/programmes',
          },
        ]}
        programmes={[
          {
            image: { alt: 'Anatomy teaching model', url: '/media/anatomy.jpg' },
            title: 'MBBS',
          },
        ]}
        title="Begin your journey"
      />,
    )

    expect(html).toContain('data-content-alignment="right"')
    expect(html).toContain('data-academic-programmes-footer-actions="true"')
    expect(html).toContain('items-end')
    expect(html).toContain('justify-center')
    expect(html.indexOf('data-academic-programmes-footer-actions')).toBeLessThan(
      html.indexOf('</section>'),
    )
  })

  it('renders titled text-only programmes and omits unusable entries', () => {
    expect(
      renderToStaticMarkup(
        <AcademicProgrammesBlockComponent programmes={[]} title="Academic programmes" />,
      ),
    ).toBe('')

    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        programmes={[{ title: 'MBBS' }, { image: { url: '/media/blank.jpg' }, title: ' ' }]}
        title="Academic programmes"
      />,
    )

    expect(html).toContain('MBBS')
    expect(html).toContain('data-academic-programme-image="false"')
    expect(html).not.toContain('/media/blank.jpg')
  })

  it('renders the responsive list presentation without grid column classes', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        columns="4"
        programmes={[
          {
            duration: '3 years',
            image: { alt: 'Postgraduate seminar', url: '/media/postgraduate.jpg' },
            intake: '12 seats',
            title: 'MD General Medicine',
          },
        ]}
        title="Academic programmes"
        viewMode="list"
      />,
    )

    expect(html).toContain('data-academic-programmes-view="list"')
    expect(html).toContain('data-academic-programme-layout="list"')
    expect(html).toContain('md:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]')
    expect(html).not.toContain('xl:grid-cols-4')
  })

  it('normalizes editable metadata labels and aligns programme details at the bottom', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        metadataPosition="bottom"
        programmes={[
          {
            ctaLabel: 'Explore MBBS',
            description: 'Programme summary',
            duration: ' 3 years ',
            durationLabel: ' Programme duration ',
            intake: ' Subject to approval ',
            intakeLabel: ' Availability ',
            linkType: 'custom',
            title: 'MBBS',
            url: '/programmes/mbbs',
          },
        ]}
        title="Academic programmes"
      />,
    )

    expect(html).toContain('data-academic-programme-metadata-position="bottom"')
    expect(html).toContain('data-academic-programme-bottom-content="true"')
    expect(html).toContain('data-academic-programme-content="bottom-metadata"')
    const metadataClasses =
      html
        .match(/<dl class="([^"]+)" data-academic-programme-metadata="bottom">/)?.[1]
        ?.split(' ') ?? []
    expect(metadataClasses).toEqual(expect.arrayContaining(['-mx-7', 'sm:-mx-8', 'border-t']))
    expect(metadataClasses).not.toContain('border-y')
    expect(metadataClasses).not.toContain('border-b')
    expect(html).toContain('pl-7 sm:pl-8')
    expect(html).toContain('pl-3 pr-7 sm:pr-8')
    expect(html).toContain('Programme duration')
    expect(html).toContain('3 years')
    expect(html).toContain('Availability')
    expect(html).toContain('Subject to approval')
    expect(html).toContain('Explore MBBS')
    expect(html).toContain('data-academic-programme-action="inline"')
    const inlineActionClasses =
      html
        .match(/<div class="([^"]+)" data-academic-programme-action="inline">/)?.[1]
        ?.split(' ') ?? []
    expect(inlineActionClasses).not.toContain('border-t')
    expect(html).toContain('inline-flex items-center gap-2')
    expect(html.indexOf('Programme summary')).toBeLessThan(html.indexOf('Explore MBBS'))
    expect(html.indexOf('Explore MBBS')).toBeLessThan(html.indexOf('Programme duration'))
  })

  it('uses fallback metadata labels and defaults unknown positions to flow', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        metadataPosition={'unsupported' as 'flow'}
        programmes={[{ duration: '4.5 years', intake: '150 seats', title: 'MBBS' }]}
        title="Academic programmes"
      />,
    )

    expect(html).toContain('data-academic-programme-metadata-position="flow"')
    expect(html).toContain('data-academic-programme-content="standard"')
    const metadataClasses =
      html.match(/<dl class="([^"]+)" data-academic-programme-metadata="flow">/)?.[1]?.split(' ') ??
      []
    expect(metadataClasses).toContain('border-y')
    expect(html).toContain('Duration')
    expect(html).toContain('Intake')
    expect(html).not.toContain('data-academic-programme-bottom-content="true"')
  })

  it('keeps filters and nested card surfaces semantic on a brand section', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        appearance={{ background: 'brand', border: 'none' }}
        programmes={[
          { cardBackground: 'default', eyebrow: 'Undergraduate', title: 'MBBS' },
          { cardBackground: 'primary', eyebrow: 'Postgraduate', title: 'MD Medicine' },
        ]}
        showFilter
        title="Academic programmes"
      />,
    )

    expect(html).toContain('bg-brand text-primary-foreground')
    expect(html).toContain(
      'rounded-full border border-primary-foreground/25 bg-primary-foreground/[0.06] p-1',
    )
    expect(html).toContain('bg-primary-foreground text-primary')
    expect(html).toContain('data-card-background="default"')
    expect(html).toContain('border-border bg-card text-card-foreground')
    expect(html).toContain('data-card-background="primary"')
    expect(html).toContain('bg-primary text-primary-foreground')
  })

  it('renders normalized detailed cards with semantic facts and one linked card target', () => {
    const html = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        columns="2"
        programmes={[
          {
            cardBackground: 'muted',
            ctaLabel: 'Apply now',
            description: 'Competency-based education with supervised clinical exposure.',
            duration: ' 4.5 years + 1 year internship ',
            facts: [
              { icon: 'Users', label: ' Seats ', value: ' 150 ' },
              {
                icon: 'BookOpen',
                label: ' Eligibility ',
                value: ' 10+2 with PCB, NEET-UG qualified ',
              },
              { icon: 'IndianRupee', label: ' Fee ', value: ' ₹16 Lakhs / year ' },
              { label: ' Campus ', value: ' Main campus ' },
              { label: 'Ignored', value: 'Fifth valid fact' },
            ],
            icon: ' GraduationCap ',
            linkType: 'custom',
            title: 'MBBS',
            url: '/programmes/mbbs',
          },
        ]}
        title="Academic programmes"
        viewMode="detailedCards"
      />,
    )

    expect(html).toContain('data-academic-programmes-view="detailedCards"')
    expect(html).toContain('data-academic-programme-layout="detailedCards"')
    expect(html).toContain('data-academic-programme-icon="graduation-cap"')
    expect(html).toContain('data-academic-programme-duration="true"')
    expect(html).toContain('4.5 years + 1 year internship')
    expect(html).toContain('<dl')
    expect(html).toContain('data-academic-programme-facts="true"')
    expect(html).toContain('Seats')
    expect(html).toContain('10+2 with PCB, NEET-UG qualified')
    expect(html).toContain('₹16 Lakhs / year')
    expect(html).toContain('Main campus')
    expect(html).not.toContain('Fifth valid fact')
    expect(html).toContain('data-academic-programme-action="detailed"')
    expect(html).toContain('mt-auto pt-7')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('href="/programmes/mbbs"')
    expect(html).toContain('font-sans')
  })

  it('closes detailed-card spacing and falls back to grid for invalid layouts', () => {
    const detailed = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        programmes={[
          {
            facts: [
              { icon: 'NotARealLucideIcon', label: ' Seats ', value: '  ' },
              { label: '  ', value: '150' },
            ],
            icon: 'NotARealLucideIcon',
            title: 'MBBS',
          },
        ]}
        title="Academic programmes"
        viewMode="detailedCards"
      />,
    )
    const fallback = renderToStaticMarkup(
      <AcademicProgrammesBlockComponent
        programmes={[{ title: 'MBBS' }]}
        title="Academic programmes"
        viewMode={'unsupported' as 'grid'}
      />,
    )

    expect(detailed).toContain('data-academic-programme-layout="detailedCards"')
    expect(detailed).not.toContain('data-academic-programme-icon=')
    expect(detailed).not.toContain('data-academic-programme-duration=')
    expect(detailed).not.toContain('data-academic-programme-facts=')
    expect(detailed).not.toContain('data-academic-programme-action=')
    expect(fallback).toContain('data-academic-programmes-view="grid"')
  })
})

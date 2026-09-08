import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LeadershipProfilesBlockComponent } from '@/blocks/LeadershipProfiles/Component'
import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'

type InspectableField = {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
    hidden?: boolean
  }
  blocks?: Array<{ slug: string }>
  defaultValue?: unknown
  fields?: InspectableField[]
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  tabs?: Array<{ fields: InspectableField[]; label: string }>
  type?: string
}

const tabs = (LeadershipProfilesBlock.fields[0] as unknown as InspectableField).tabs ?? []
const contentFields = tabs.find(({ label }) => label === 'Content')?.fields ?? []
const themeFields = tabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []

const findField = (fields: InspectableField[], name: string): InspectableField | undefined => {
  for (const field of fields) {
    if (field.name === name) return field
    const nested = [...(field.fields ?? []), ...(field.tabs ?? []).flatMap((tab) => tab.fields)]
    const found = findField(nested, name)
    if (found) return found
  }
}

describe('Leadership Profiles block', () => {
  const validImage = {
    alt: 'Portrait of Dr. Ananya Sharma',
    height: 900,
    url: '/media/ananya-sharma.jpg',
    width: 1200,
  }

  it('defines the approved block identity and two-tab authoring model', () => {
    expect(LeadershipProfilesBlock.slug).toBe('leadershipProfiles')
    expect(LeadershipProfilesBlock.interfaceName).toBe('LeadershipProfilesBlock')
    expect(LeadershipProfilesBlock.labels).toEqual({
      plural: 'Leadership Profiles',
      singular: 'Leadership Profiles',
    })
    expect(tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(findField(contentFields, 'title')).toMatchObject({ type: 'text' })
    expect(findField(contentFields, 'title')?.required).not.toBe(true)
    expect(findField(contentFields, 'actions')).toMatchObject({ maxRows: 2, type: 'array' })
    expect(findField(contentFields, 'footerActions')).toMatchObject({
      maxRows: 2,
      type: 'array',
    })
  })

  it('defines required profile media and name with bounded structured metadata', () => {
    const profiles = findField(contentFields, 'profiles')
    expect(profiles).toMatchObject({ maxRows: 24, minRows: 1, required: true, type: 'array' })
    expect(findField(profiles?.fields ?? [], 'image')).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(findField(profiles?.fields ?? [], 'name')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(findField(profiles?.fields ?? [], 'expertise')).toMatchObject({
      maxRows: 3,
      type: 'array',
    })
    expect(findField(profiles?.fields ?? [], 'item')).toMatchObject({
      required: true,
      type: 'text',
    })
    const legacyCardBackground = findField(profiles?.fields ?? [], 'cardBackground')
    expect(legacyCardBackground?.admin?.hidden).toBe(true)
    expect(legacyCardBackground?.options?.map(({ value }) => value)).toEqual([
      'default',
      'primary',
      'secondary',
      'muted',
      'accent',
    ])
  })

  it('exposes only approved header, spacing, crop, and column controls', () => {
    const cardLayout = findField(themeFields, 'cardLayout')
    expect(cardLayout).toMatchObject({
      defaultValue: 'standard',
      required: true,
      type: 'select',
    })
    expect(cardLayout?.options?.map(({ value }) => value)).toEqual(['standard', 'imageOverlay'])

    const cardBackground = findField(themeFields, 'cardBackground')
    expect(cardBackground).toMatchObject({
      defaultValue: 'default',
      required: true,
      type: 'select',
    })
    expect(cardBackground?.options?.map(({ value }) => value)).toEqual([
      'default',
      'primary',
      'secondary',
      'muted',
      'accent',
    ])
    expect(cardBackground?.admin?.condition?.({}, { cardLayout: 'standard' })).toBe(true)
    expect(cardBackground?.admin?.condition?.({}, { cardLayout: 'imageOverlay' })).toBe(false)

    for (const [name, defaultValue] of [
      ['themeMode', 'dark'],
      ['overlayStyle', 'dark'],
      ['overlayDirection', 'bottomToTop'],
      ['overlayCoverage', 'full'],
    ] as const) {
      const field = findField(themeFields, name)
      expect(field).toMatchObject({ defaultValue, required: true, type: 'select' })
      expect(field?.admin?.condition?.({}, { cardLayout: 'imageOverlay' })).toBe(true)
      expect(field?.admin?.condition?.({}, { cardLayout: 'standard' })).toBe(false)
    }
    expect(findField(themeFields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      required: true,
    })
    expect(findField(themeFields, 'headerLayout')).toMatchObject({
      defaultValue: 'split',
      required: true,
    })
    expect(findField(themeFields, 'descriptionPosition')).toMatchObject({
      defaultValue: 'side',
      required: true,
    })
    expect(findField(themeFields, 'sideContentAlignment')).toMatchObject({
      defaultValue: 'bottom',
      required: true,
    })
    expect(findField(themeFields, 'columns')).toMatchObject({
      defaultValue: '3',
      required: true,
    })
    expect(findField(themeFields, 'columns')?.options?.map(({ value }) => value)).toEqual([
      '2',
      '3',
      '4',
    ])
    expect(findField(contentFields, 'imagePosition')?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(
      findField(themeFields, 'descriptionPosition')?.admin?.condition?.(
        {},
        { headerLayout: 'split' },
      ),
    ).toBe(true)
    expect(
      findField(themeFields, 'descriptionPosition')?.admin?.condition?.(
        {},
        { headerLayout: 'stacked' },
      ),
    ).toBe(false)
  })

  it('does not define profile interaction fields', () => {
    const profiles = findField(contentFields, 'profiles')
    const source = JSON.stringify(profiles)
    for (const forbidden of [
      'ctaLabel',
      'linkType',
      'page',
      'url',
      'openInNewTab',
      'actionLabel',
    ]) {
      expect(source).not.toContain(`"name":"${forbidden}"`)
    }
  })

  it('renders a static, opaque, semantic leadership card without profile interaction', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        appearance={{ background: 'subtle', border: 'none' }}
        eyebrow="Leadership"
        profiles={[
          {
            cardBackground: 'default',
            designation: 'Principal & Professor of Medicine',
            expertise: [{ item: 'Academic administration' }, { item: 'Clinical education' }],
            image: validImage,
            leadershipLabel: 'Principal',
            name: 'Dr. Ananya Sharma',
            qualification: 'MD (Medicine)',
          },
        ]}
        title="Academic leadership"
      />,
    )

    expect(html).toContain('data-leadership-profiles="true"')
    expect(html).toContain('data-leadership-profile-card="true"')
    expect(html).toContain('data-card-surface="default"')
    expect(html).toContain('bg-card')
    expect(html).toContain('text-card-foreground')
    expect(html).toContain('aspect-4/3')
    expect(html).not.toContain('sm:text-lg')
    expect(html).toContain('Principal &amp; Professor of Medicine')
    expect(html).toContain('MD (Medicine)')
    expect(html).toContain('Academic administration')
    expect(html).toContain('Clinical education')
    expect(html).toMatch(/<h3[^>]*>Dr\. Ananya Sharma<\/h3>/)
    expect(html).toMatch(/<h3[^>]*class="[^"]*font-sans[^"]*"[^>]*>Dr\. Ananya Sharma<\/h3>/)
    expect(html).not.toMatch(
      /<h3[^>]*class="[^"]*font-\[family-name:var\(--font-display\)\][^"]*"[^>]*>Dr\. Ananya Sharma<\/h3>/,
    )
    expect(html).toContain('data-leadership-profile-accent-surface="default"')
    expect(html).toContain('data-leadership-profile-qualification="true"')
    expect(html).toContain('data-leadership-profile-expertise="true"')
    expect(html).toContain('text-xs')
    expect(html.indexOf('data-leadership-profile-label="true"')).toBeGreaterThan(
      html.indexOf('aspect-4/3'),
    )
    expect(html.indexOf('data-leadership-profile-label="true"')).toBeLessThan(
      html.indexOf('>Dr. Ananya Sharma</'),
    )
    expect(html).not.toContain('absolute top-4 left-4')
    expect(html).not.toMatch(/<(a|button)\b/)
    expect(html).not.toContain('cursor-pointer')
  })

  it('renders the portrait image-overlay layout with shared overlay semantics', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        cardLayout="imageOverlay"
        overlayCoverage="split"
        overlayDirection="bottomToTop"
        overlayStyle="darker"
        profiles={[
          {
            designation: 'Dean, Academic Affairs',
            expertise: [{ item: 'Curriculum planning' }],
            image: validImage,
            leadershipLabel: 'Dean, Academics',
            name: 'Dr. Kavita Rao',
            qualification: 'MD (Physiology)',
          },
        ]}
        themeMode="brand"
        title="Leadership"
      />,
    )

    expect(html).toContain('data-leadership-profile-layout="imageOverlay"')
    expect(html).toContain('aspect-4/5')
    expect(html).toContain('data-leadership-profile-overlay="darker"')
    expect(html).toContain('data-leadership-profile-overlay-coverage="split"')
    expect(html).toContain('data-leadership-profile-overlay-direction="bottomToTop"')
    expect(html).toContain('data-leadership-profile-overlay-tone="brand"')
    expect(html).toContain('bg-linear-to-t')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('Dean, Academics')
    expect(html).toContain('Dr. Kavita Rao')
    expect(html).toContain('Dean, Academic Affairs')
    expect(html).not.toContain('MD (Physiology)')
    expect(html).not.toContain('Curriculum planning')
    expect(html).not.toMatch(/<(a|button)\b/)
  })

  it.each([
    ['light', 'text-light-overlay-foreground'],
    ['dark', 'text-white/82'],
    ['brand', 'text-primary-foreground'],
  ] as const)('highlights the Image Overlay label for the %s tone', (themeMode, expectedClass) => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        cardLayout="imageOverlay"
        profiles={[
          {
            image: validImage,
            leadershipLabel: 'General Medicine',
            name: 'Dr. Rakesh Kumar Jha',
          },
        ]}
        themeMode={themeMode}
      />,
    )

    expect(html).toMatch(
      new RegExp(`<p class="[^"]*${expectedClass}[^"]*" data-leadership-profile-label="true">`),
    )
  })

  it('keeps Standard as the default and runtime fallback while normalizing overlay defaults', () => {
    const standardHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent profiles={[{ image: validImage, name: 'Leader' }]} />,
    )
    const invalidHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        cardLayout={'invalid' as 'standard'}
        profiles={[{ image: validImage, name: 'Leader' }]}
      />,
    )
    const overlayHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        cardLayout="imageOverlay"
        profiles={[{ image: validImage, name: 'Leader' }]}
      />,
    )

    expect(standardHtml).toContain('data-leadership-profile-layout="standard"')
    expect(invalidHtml).toContain('data-leadership-profile-layout="standard"')
    expect(overlayHtml).toContain('data-leadership-profile-overlay="dark"')
    expect(overlayHtml).toContain('data-leadership-profile-overlay-coverage="full"')
    expect(overlayHtml).toContain('data-leadership-profile-overlay-direction="bottomToTop"')
    expect(overlayHtml).toContain('data-leadership-profile-overlay-tone="dark"')
  })

  it('uses one block surface with a first-profile fallback for legacy content', () => {
    const profiles = [
      {
        cardBackground: 'primary',
        image: validImage,
        name: 'Dr. Ananya Sharma',
      },
      {
        cardBackground: 'accent',
        image: validImage,
        name: 'Dr. Arvind Mehta',
      },
    ]
    const legacyHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent profiles={profiles} title="Leadership" />,
    )
    const configuredHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        cardBackground="muted"
        profiles={profiles}
        title="Leadership"
      />,
    )

    expect(legacyHtml.match(/data-card-surface="primary"/g)).toHaveLength(2)
    expect(legacyHtml).not.toContain('data-card-surface="accent"')
    expect(configuredHtml.match(/data-card-surface="muted"/g)).toHaveLength(2)
    expect(configuredHtml).not.toContain('data-card-surface="primary"')
    expect(configuredHtml).not.toContain('data-card-surface="accent"')
  })

  it('omits unusable rows and trims ordered metadata to three expertise items', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        profiles={[
          { image: validImage, name: ' ' },
          { image: null, name: 'Missing image' },
          {
            expertise: [
              { item: ' Curriculum ' },
              { item: ' ' },
              { item: 'Clinical governance' },
              { item: 'Mentorship' },
              { item: 'Must not render' },
            ],
            image: { ...validImage, alt: ' ' },
            name: ' Dr. Kavita Rao ',
            qualification: ' MD (Physiology) ',
          },
        ]}
        title="Academic leadership"
      />,
    )

    expect(html.match(/data-leadership-profile-card=/g)).toHaveLength(1)
    expect(html).toContain('alt="Dr. Kavita Rao"')
    expect(html).toContain('Curriculum')
    expect(html).toContain('Clinical governance')
    expect(html).toContain('Mentorship')
    expect(html).not.toContain('Must not render')
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(2)
  })

  it('omits absent optional profile elements without empty wrappers', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        profiles={[{ image: validImage, name: 'Dr. Arvind Mehta' }]}
        title="Leadership"
      />,
    )

    expect(html).not.toContain('data-leadership-profile-label')
    expect(html).not.toContain('data-leadership-profile-designation')
    expect(html).not.toContain('data-leadership-profile-qualification')
    expect(html).not.toContain('data-leadership-profile-expertise')
  })

  it.each([
    ['2', 'xl:grid-cols-2'],
    ['3', 'xl:grid-cols-3'],
    ['4', 'xl:grid-cols-4'],
  ] as const)(
    'uses one mobile, at most two tablet, and %s desktop columns',
    (columns, wideClass) => {
      const html = renderToStaticMarkup(
        <LeadershipProfilesBlockComponent
          columns={columns}
          profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
          title="Leadership"
        />,
      )

      const classes =
        html.match(/<div class="([^"]+)" data-leadership-profiles-grid="true">/)?.[1].split(' ') ??
        []
      expect(classes).toEqual(
        expect.arrayContaining(['grid', 'grid-cols-1', 'md:grid-cols-2', wideClass]),
      )
    },
  )

  it('normalizes invalid columns, crop, alignment, size, and explicit card surfaces', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        columns={'9' as '3'}
        contentAlignment={'diagonal' as 'left'}
        profiles={[
          {
            cardBackground: 'primary',
            designation: 'Dean, Academic Affairs',
            image: validImage,
            imagePosition: 'invalid',
            name: 'Dr. Kavita Rao',
          },
        ]}
        size={'huge' as 'default'}
        title="Leadership"
      />,
    )

    expect(html).toContain('xl:grid-cols-3')
    expect(html).toContain('data-content-alignment="left"')
    expect(html).toContain('object-center')
    expect(html).toContain('data-card-surface="primary"')
    expect(html).toContain('bg-primary text-primary-foreground')
    expect(html).toContain('py-12 md:py-16')
  })

  it.each([
    ['left', 'mr-auto'],
    ['center', 'mx-auto'],
    ['right', 'ml-auto'],
  ] as const)(
    'positions a %s stacked header across the full container',
    (alignment, outerClass) => {
      const html = renderToStaticMarkup(
        <LeadershipProfilesBlockComponent
          contentAlignment={alignment}
          description="Lead with the institution's academic and clinical leadership."
          headerLayout="stacked"
          profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
          title="Academic leadership"
        />,
      )
      const classes =
        html
          .match(/<header class="([^"]+)" data-leadership-profiles-header="stacked">/)?.[1]
          .split(' ') ?? []

      expect(classes).toEqual(expect.arrayContaining(['grid', 'w-full', 'max-w-3xl', outerClass]))
      expect(html).toContain(`data-content-alignment="${alignment}"`)
    },
  )

  it('supports split description placement, side alignment, section actions, and footer actions', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        actions={[{ label: 'Meet the college', linkType: 'custom', url: '/about' }]}
        description="Lead with the institution's academic and clinical leadership."
        descriptionPosition="underTitle"
        footerActions={[{ label: 'Explore departments', linkType: 'custom', url: '/departments' }]}
        profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
        sideContentAlignment="top"
        title="Academic leadership"
      />,
    )

    expect(html).toContain('data-leadership-profiles-header="split"')
    expect(html).toContain('data-leadership-profiles-side-alignment="top"')
    expect(html).toContain('lg:self-start')
    expect(html).toContain('Meet the college')
    expect(html).toContain('data-leadership-profiles-footer-actions="true"')
    expect(html).toContain('Explore departments')
  })

  it('renders profiles without a title and omits an entirely empty header', () => {
    const html = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        profiles={[{ image: validImage, name: 'Leader' }]}
        title=" "
      />,
    )

    expect(html).toContain('data-leadership-profiles="true"')
    expect(html).toContain('data-leadership-profiles-grid="true"')
    expect(html).toContain('<div class="flex flex-col"><div class="grid gap-6')
    expect(html).not.toContain('data-leadership-profiles-header')
    expect(html).toMatch(/<h2[^>]*>Leader<\/h2>/)
  })

  it('uses an accent-only title as the heading and preserves title-free header content', () => {
    const accentOnlyHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        accentTitle="Clinical leadership"
        profiles={[{ image: validImage, name: 'Leader' }]}
      />,
    )
    const contentOnlyHtml = renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        actions={[{ label: 'Our college', linkType: 'custom', url: '/college' }]}
        description="Meet our academic and clinical leaders."
        eyebrow="Leadership"
        profiles={[{ image: validImage, name: 'Leader' }]}
      />,
    )

    expect(accentOnlyHtml).toContain('<h2')
    expect(accentOnlyHtml).toContain('<em class="block font-[inherit]">Clinical leadership</em>')
    expect(accentOnlyHtml).toMatch(/<h3[^>]*>Leader<\/h3>/)
    expect(contentOnlyHtml).toContain('data-leadership-profiles-header="split"')
    expect(contentOnlyHtml).toContain('Leadership')
    expect(contentOnlyHtml).toContain('Meet our academic and clinical leaders.')
    expect(contentOnlyHtml).toContain('Our college')
    expect(contentOnlyHtml).toMatch(/<h2[^>]*>Leader<\/h2>/)
  })

  it('defines a surface-aware SNMIH accent for leadership labels and designations', () => {
    const styles = readFileSync('src/styles/custom.css', 'utf8')

    expect(styles).toContain('[data-leadership-profile-accent-surface]')
    expect(styles).toContain("[data-leadership-profile-accent-surface='primary']")
    expect(styles).toContain('color-mix(in oklch, var(--success)')
    expect(styles).toContain('color: var(--ring)')
    expect(styles).toContain('color: var(--primary-foreground)')
  })

  it('returns no section when every profile is unusable', () => {
    expect(
      renderToStaticMarkup(
        <LeadershipProfilesBlockComponent
          profiles={[{ image: null, name: 'Leader' }]}
          title="Leadership"
        />,
      ),
    ).toBe('')
  })

  it('keeps the component server-only', () => {
    const source = readFileSync('src/blocks/LeadershipProfiles/Component.tsx', 'utf8')
    expect(source).not.toMatch(/^['"]use client['"]/m)
    expect(source).not.toContain('useState')
    expect(source).not.toContain('useEffect')
  })

  it('is registered across every Page-compatible schema and both renderers', () => {
    const collectSlugs = (fields: InspectableField[]): string[] =>
      fields.flatMap((field) => {
        if (field.type === 'blocks') {
          return (field.blocks ?? []).map(({ slug }) => slug)
        }
        return [
          ...(field.fields ? collectSlugs(field.fields) : []),
          ...(field.tabs ?? []).flatMap((tab) => collectSlugs(tab.fields)),
        ]
      })

    expect(collectSlugs(Pages.fields as unknown as InspectableField[])).toContain(
      'leadershipProfiles',
    )
    expect(collectSlugs(ReusableSections.fields as unknown as InspectableField[])).toContain(
      'leadershipProfiles',
    )
    expect(
      collectSlugs(NewsEventsDetailTemplate.fields as unknown as InspectableField[]),
    ).toContain('leadershipProfiles')

    const productionRenderer = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
    const previewRenderer = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')
    for (const source of [productionRenderer, previewRenderer]) {
      expect(source).toContain("case 'leadershipProfiles'")
      expect(source).toContain('LeadershipProfilesBlockComponent')
    }
  })

  it('keeps generated Payload types aligned with the schema', () => {
    const generated = readFileSync('src/payload-types.ts', 'utf8')
    expect(generated).toContain('export interface LeadershipProfilesBlock')
    expect(generated).toContain("blockType: 'leadershipProfiles'")
    expect(generated).toContain('export interface LeadershipProfilesBlockSelect')
  })
})

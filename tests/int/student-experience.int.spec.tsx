import { readFileSync } from 'node:fs'

import type { ArrayField, Field, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { StudentExperienceBlockComponent } from '@/blocks/StudentExperience/Component'
import { StudentExperienceBlock } from '@/blocks/StudentExperience/config'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'

const pageRendererSource = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
const livePreviewRendererSource = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')
const payloadTypesSource = readFileSync('src/payload-types.ts', 'utf8')
const thumbnailFixturesSource = readFileSync('src/block-thumbnails/fixtures.tsx', 'utf8')

const media = (id: number) => ({
  alt: `Experience ${id}`,
  height: 900,
  id,
  url: `/experience-${id}.jpg`,
  width: 1200,
})

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
  }
}

describe('StudentExperienceBlock schema', () => {
  it('defines the editorial mosaic and its focused controls', () => {
    expect(StudentExperienceBlock).toMatchObject({
      interfaceName: 'StudentExperienceBlock',
      slug: 'studentExperience',
      labels: {
        singular: 'Student Experience',
        plural: 'Student Experiences',
      },
    })
    expect(StudentExperienceBlock.admin?.images?.thumbnail).toEqual({
      alt: 'Student Experience block preview',
      url: '/block-thumbnails/student-experience.jpg',
    })

    const tabs = StudentExperienceBlock.fields[0] as TabsField
    expect(tabs.tabs.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])

    const experiences = findNamedField(StudentExperienceBlock.fields, 'experiences') as ArrayField
    expect(experiences).toMatchObject({ required: true, minRows: 1, maxRows: 5 })
    expect(findNamedField(StudentExperienceBlock.fields, 'title')).not.toHaveProperty(
      'required',
      true,
    )
    expect(findNamedField(StudentExperienceBlock.fields, 'headerLayout')).toMatchObject({
      defaultValue: 'split',
    })
    expect(findNamedField(StudentExperienceBlock.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
    })
    expect(findNamedField(StudentExperienceBlock.fields, 'themeMode')).toMatchObject({
      defaultValue: 'auto',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Brand', value: 'brand' },
      ],
      required: true,
      type: 'select',
    })
    expect(findNamedField(StudentExperienceBlock.fields, 'overlayStrength')).toMatchObject({
      defaultValue: 'dark',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Darker', value: 'darker' },
      ],
      required: true,
      type: 'select',
    })
    expect(findNamedField(StudentExperienceBlock.fields, 'overlayDirection')).toMatchObject({
      defaultValue: 'bottomToTop',
      options: [
        { label: 'Even / Vertical', value: 'vertical' },
        { label: 'Left to Right', value: 'leftToRight' },
        { label: 'Right to Left', value: 'rightToLeft' },
        { label: 'Bottom to Top', value: 'bottomToTop' },
        { label: 'Top to Bottom', value: 'topToBottom' },
      ],
      required: true,
      type: 'select',
    })
    expect(findNamedField(StudentExperienceBlock.fields, 'overlayCoverage')).toMatchObject({
      defaultValue: 'full',
      options: [
        { label: 'Full', value: 'full' },
        { label: 'Split (50%)', value: 'split' },
      ],
      required: true,
      type: 'select',
    })

    const experienceTabs = experiences.fields[0] as TabsField
    const experienceThemeFields =
      experienceTabs.tabs.find((tab) => tab.label === 'Theme Settings')?.fields ?? []
    const experienceThemeNames = experienceThemeFields.flatMap((field) =>
      'name' in field ? [field.name] : [],
    )
    expect(experienceThemeNames.indexOf('overlayCoverage')).toBe(
      experienceThemeNames.indexOf('overlayDirection') + 1,
    )

    const contentFields = tabs.tabs[0]?.fields ?? []
    const names = contentFields.flatMap((field) => ('name' in field ? [field.name] : []))
    expect(names.indexOf('actions')).toBeLessThan(names.indexOf('experiences'))
    expect(names.indexOf('footerActions')).toBeGreaterThan(names.indexOf('experiences'))
  })
})

describe('StudentExperienceBlockComponent', () => {
  it('renders the asymmetric five-card composition with themed editorial type', () => {
    const html = renderToStaticMarkup(
      <StudentExperienceBlockComponent
        accentTitle="medical college."
        appearance={{ background: 'subtle', border: 'top' }}
        description="Learning extends beyond lectures."
        eyebrow="The student experience"
        experiences={[1, 2, 3, 4, 5].map((id) => ({ image: media(id), title: `Card ${id}` }))}
        title="More than a"
      />,
    )

    expect(html).toContain('data-student-experience="true"')
    expect(html).toContain('data-student-experience-header="split"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain(
      'font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).not.toContain('lg:text-5xl xl:text-6xl')
    expect(
      html.match(
        /font-sans text-lg leading-tight font-semibold tracking-tight text-balance sm:text-xl/g,
      ) ?? [],
    ).toHaveLength(5)
    expect(html).not.toContain(
      'font-sans text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl',
    )
    expect(html).toContain('xl:row-span-2')
    expect(html).toContain('data-student-experience-grid-layout="mosaic"')
    expect(html.match(/<article/g) ?? []).toHaveLength(5)
    expect(html).toContain('Card 5')
    expect(html).toContain('01')
    expect(html).toContain('05')
    expect(html).toContain('data-section-eyebrow-surface="darkOverlay"')
  })

  it('renders valid cards without optional section copy and links only configured cards', () => {
    const html = renderToStaticMarkup(
      <StudentExperienceBlockComponent
        experiences={[
          {
            image: media(1),
            linkType: 'custom',
            openInNewTab: true,
            title: 'Campus Life',
            url: '/campus-life',
          },
          { image: media(2), title: 'Clinical Training' },
        ]}
        showNumbers={false}
      />,
    )

    expect(html).toContain('Campus Life')
    expect(html).toContain('href="/campus-life"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('<article')
    expect(html).not.toContain('data-section-eyebrow-surface="darkOverlay"')
  })

  it('positions stacked section content according to its alignment setting', () => {
    const html = renderToStaticMarkup(
      <StudentExperienceBlockComponent
        contentAlignment="center"
        description="Learning extends beyond lectures."
        experiences={[{ image: media(1), title: 'Campus Life' }]}
        headerLayout="stacked"
        title="More than a medical college."
      />,
    )

    expect(html).toContain('data-student-experience-content-alignment="center"')
    expect(html).toContain('grid gap-6 w-full max-w-3xl mx-auto')
    expect(html).toContain('items-center text-center')
  })

  it('renders each card with its own overlay tone, strength, and direction', () => {
    const html = renderToStaticMarkup(
      <StudentExperienceBlockComponent
        experiences={[
          {
            image: media(1),
            overlayCoverage: 'split',
            overlayDirection: 'rightToLeft',
            overlayStrength: 'darker',
            themeMode: 'light',
            title: 'Campus Life',
          },
          {
            image: media(2),
            overlayStrength: 'strong',
            title: 'Legacy strength',
          },
        ]}
      />,
    )

    expect(html).toContain('data-student-experience-overlay-tone="light"')
    expect(html).toContain('data-student-experience-overlay-strength="darker"')
    expect(html).toContain('data-student-experience-overlay-direction="rightToLeft"')
    expect(html).toContain('data-student-experience-overlay-coverage="split"')
    expect(html).toContain('absolute inset-y-0 right-0 w-1/2 bg-linear-to-l')
    expect(html).toContain('bg-linear-to-l from-white via-white/84 to-transparent')
    expect(html).toContain('text-light-overlay-foreground')
    expect(html).toContain('bg-linear-to-t from-black/94 via-black/74 to-transparent')
  })

  it('omits the block when no valid image cards remain', () => {
    expect(renderToStaticMarkup(<StudentExperienceBlockComponent experiences={[]} />)).toBe('')
    expect(
      renderToStaticMarkup(
        <StudentExperienceBlockComponent
          experiences={[{ image: media(1), title: '   ' }]}
          title="Student life"
        />,
      ),
    ).toBe('')
  })
})

describe('StudentExperienceBlock registration', () => {
  it('registers the block everywhere a page can render or preview it', () => {
    expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('studentExperience')
    expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('studentExperience')
    expect(pageRendererSource).toContain("case 'studentExperience'")
    expect(livePreviewRendererSource).toContain("case 'studentExperience'")
    expect(payloadTypesSource).toContain('export interface StudentExperienceBlock')
    expect(thumbnailFixturesSource).toContain('studentExperience: (')
  })
})

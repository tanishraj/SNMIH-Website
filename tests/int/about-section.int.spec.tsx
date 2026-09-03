import type { ArrayField, Field, GroupField, SelectField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AboutSectionBlockComponent } from '@/blocks/AboutSection/Component'
import { AboutSectionBlock } from '@/blocks/AboutSection/config'

function findNamedField(fields: Field[], name: string): Field | undefined {
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

  return undefined
}

describe('About Section lists', () => {
  it('exposes ordered and unordered list content with optional item icons', () => {
    const listStyle = findNamedField(AboutSectionBlock.fields, 'listStyle') as SelectField
    const listItems = findNamedField(AboutSectionBlock.fields, 'listItems') as ArrayField

    expect(listStyle).toMatchObject({
      type: 'select',
      defaultValue: 'unordered',
      options: [
        { label: 'Unordered', value: 'unordered' },
        { label: 'Ordered', value: 'ordered' },
      ],
    })
    expect(listItems).toMatchObject({ type: 'array', maxRows: 12 })
    expect(findNamedField(listItems.fields, 'text')).toMatchObject({ type: 'text', required: true })
    expect(findNamedField(listItems.fields, 'icon')).toMatchObject({ type: 'text' })
  })

  it('mirrors the Feature Spotlight media-fill options for split layouts', () => {
    const mediaFillMode = findNamedField(AboutSectionBlock.fields, 'mediaFillMode') as SelectField

    expect(mediaFillMode).toMatchObject({
      type: 'select',
      defaultValue: 'contained',
      options: [
        { label: 'Contained', value: 'contained' },
        { label: 'Contained Fill', value: 'containedFill' },
        { label: 'Edge to Edge', value: 'edgeToEdge' },
      ],
    })
  })

  it('configures an optional editor-authored image detail panel', () => {
    const imageDetail = findNamedField(AboutSectionBlock.fields, 'imageDetail') as GroupField
    const imageDetailPosition = findNamedField(
      AboutSectionBlock.fields,
      'imageDetailPosition',
    ) as SelectField
    const imageDetailBackground = findNamedField(
      AboutSectionBlock.fields,
      'imageDetailBackground',
    ) as SelectField

    expect(imageDetail).toMatchObject({ type: 'group', label: 'Image Detail Panel' })
    expect(findNamedField(imageDetail.fields, 'enabled')).toMatchObject({
      type: 'checkbox',
      defaultValue: false,
    })
    expect(findNamedField(imageDetail.fields, 'eyebrow')).toMatchObject({ type: 'text' })
    expect(findNamedField(imageDetail.fields, 'value')).toMatchObject({ type: 'text' })
    expect(findNamedField(imageDetail.fields, 'description')).toMatchObject({ type: 'textarea' })
    expect(imageDetailPosition).toMatchObject({
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Bottom Left', value: 'left' },
        { label: 'Bottom Right', value: 'right' },
      ],
    })
    expect(imageDetailBackground).toMatchObject({
      type: 'select',
      defaultValue: 'brand',
      options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Brand', value: 'brand' },
        { label: 'Gradient: Subtle', value: 'gradient-subtle' },
        { label: 'Gradient: Brand', value: 'gradient-brand' },
      ],
    })
  })

  it('renders semantic ordered lists with custom-icon and number markers', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="Our programmes combine academic depth with clinical practice."
        listItems={[
          { icon: 'Stethoscope', text: 'Clinical experience from the first year' },
          { text: 'Specialist teaching across disciplines' },
        ]}
        listStyle="ordered"
        title="Building physicians of tomorrow"
      />,
    )

    expect(html).toContain('<ol')
    expect(html).toContain('data-about-list-style="ordered"')
    expect(html).toContain('data-list-marker="custom-icon"')
    expect(html).toContain('lucide-stethoscope')
    expect(html).toContain('data-list-marker="number"')
  })

  it('renders an unordered checkmark fallback and adapts markers on brand surfaces', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        appearance={{ background: 'brand' }}
        body="A purpose-built academic campus."
        listItems={[{ text: 'NMC-approved MBBS programme' }]}
        listStyle="unordered"
        title="Our story"
      />,
    )

    expect(html).toContain('<ul')
    expect(html).toContain('data-about-list-style="unordered"')
    expect(html).toContain('data-list-marker="fallback-icon"')
    expect(html).toContain('text-current')
  })

  it('fills the section height with media inside the normal container', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Lecture theatre', url: '/media/lecture-theatre.jpg' } as never}
        imagePosition="left"
        mediaFillMode="containedFill"
        size="comfortable"
        title="Our story"
        variant="split"
      />,
    )

    expect(html).toContain('data-about-media-fill="containedFill"')
    expect(html).toContain('data-about-media-frame="containedFill"')
    expect(html).toContain('data-about-image-side="left"')
    expect(html).toContain('py-20 md:py-0')
    expect(html).toContain('min-h-[30rem] md:min-h-[40rem]')
    expect(html).toContain('relative aspect-4/3 overflow-hidden md:aspect-auto md:h-full')
    expect(html).not.toContain('rounded-card')
  })

  it('stretches contained media to the actual content height on desktop', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Lecture theatre', url: '/media/lecture-theatre.jpg' } as never}
        imagePosition="left"
        listItems={[
          { text: 'NMC-approved MBBS programme' },
          { text: 'Post-graduate programmes across specialties' },
        ]}
        mediaFillMode="contained"
        title="Our story"
        variant="split"
      />,
    )

    expect(html).toContain('data-about-media-fill="contained"')
    expect(html).toContain('grid items-stretch gap-10 md:grid-cols-2')
    expect(html).toContain('data-about-media-frame="contained"')
    expect(html).toContain('md:h-full md:aspect-auto')
    expect(html).toContain('rounded-card')
  })

  it('extends split media to the viewport edge while retaining contained content alignment', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Lecture theatre', url: '/media/lecture-theatre.jpg' } as never}
        imagePosition="right"
        mediaFillMode="edgeToEdge"
        title="Our story"
        variant="split"
      />,
    )

    expect(html).toContain('data-about-media-fill="edgeToEdge"')
    expect(html).toContain('data-about-media-frame="edgeToEdge"')
    expect(html).toContain('data-about-image-side="right"')
    expect(html).toContain('grid items-stretch gap-8 md:grid-cols-2 md:gap-0')
    expect(html).toContain('ml-auto h-full w-full max-w-[calc(var(--breakpoint-2xl)/2)] pl-4')
    expect(html).toContain('relative aspect-4/3 overflow-hidden md:aspect-auto md:min-h-full')
    expect(html).not.toContain('rounded-card')
  })

  it('renders the image detail panel over the selected lower image corner', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Hospital ward', url: '/media/hospital-ward.jpg' } as never}
        imageDetail={{
          description: 'Growing medical education and healthcare access in Bihar.',
          enabled: true,
          eyebrow: 'Established',
          value: '2021',
        }}
        imageDetailPosition="right"
        imagePosition="left"
        mediaFillMode="containedFill"
        title="Our story"
        variant="split"
      />,
    )

    expect(html).toContain('data-about-image-detail="true"')
    expect(html).toContain('data-about-image-detail-position="right"')
    expect(html).toContain('data-about-image-detail-background="brand"')
    expect(html).toContain('border-ring')
    expect(html).toContain('bg-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
    expect(html).toContain('Established')
    expect(html).toContain('2021')
    expect(html).toContain('Growing medical education and healthcare access in Bihar.')
    expect(html).toContain('text-4xl')
    expect(html).toContain('text-xs leading-6 text-current/75 sm:text-sm sm:leading-6')
  })

  it('uses the selected theme surface for the image detail panel', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Hospital ward', url: '/media/hospital-ward.jpg' } as never}
        imageDetail={{ enabled: true, eyebrow: 'Established', value: '2021' }}
        imageDetailBackground="gradient-subtle"
        title="Our story"
      />,
    )

    expect(html).toContain('data-about-image-detail-background="gradient-subtle"')
    expect(html).toContain('bg-gradient-subtle text-foreground')
    expect(html).toContain('data-section-eyebrow-surface="gradient-subtle"')
  })

  it('matches Values and Pillars descriptions to the shared description scale', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        title="Our story"
        values={[{ description: 'Learning works better together.', title: 'Community' }]}
      />,
    )

    expect(html).toContain('mt-1 text-base leading-7 text-current/70')
  })

  it('does not render incomplete or disabled image detail panels', () => {
    const html = renderToStaticMarkup(
      <AboutSectionBlockComponent
        body="A purpose-built academic campus."
        image={{ alt: 'Hospital ward', url: '/media/hospital-ward.jpg' } as never}
        imageDetail={{ enabled: false, eyebrow: 'Established', value: '2021' }}
        title="Our story"
      />,
    )

    expect(html).not.toContain('data-about-image-detail="true"')
  })
})

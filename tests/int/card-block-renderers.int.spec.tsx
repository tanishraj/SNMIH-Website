import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AcademicProgrammesBlockComponent } from '@/blocks/AcademicProgrammes/Component'
import { AwardsListBlockComponent } from '@/blocks/AwardsList/Component'
import { BentoGridBlockComponent } from '@/blocks/BentoGrid/Component'
import { ContentHighlightsBlockComponent } from '@/blocks/ContentHighlights/Component'
import { DownloadListBlockComponent } from '@/blocks/DownloadList/Component'
import { FeatureMatrixBlockComponent } from '@/blocks/FeatureMatrix/Component'
import { IconGridBlockComponent } from '@/blocks/IconGrid/Component'
import { LeadershipProfilesBlockComponent } from '@/blocks/LeadershipProfiles/Component'
import { MediaCarouselBlockComponent } from '@/blocks/MediaCarousel/Component'
import { NumberedStepsBlockComponent } from '@/blocks/NumberedSteps/Component'
import { ProfileCarouselBlockComponent } from '@/blocks/ProfileCarousel/Component'
import { ProgramMatrixBlockComponent } from '@/blocks/ProgramMatrix/Component'
import { TeamShowcaseBlockComponent } from '@/blocks/TeamShowcase/Component'
import { TestimonialGridBlockComponent } from '@/blocks/TestimonialGrid/Component'

const media = {
  id: 1,
  alt: 'Campus',
  url: '/campus.jpg',
}

const expectPrimarySurface = (html: string) => {
  expect(html).toContain('data-card-background="primary"')
  expect(html).toContain('bg-primary text-primary-foreground')
}

const expectInheritedDefaultSurface = (html: string) => {
  expect(html).toContain('data-card-background="default"')
  expect(html).toContain('bg-transparent text-current')
  expect(html).not.toContain('bg-card text-card-foreground')
}

describe('semantic card surface rendering', () => {
  it('renders semantic surfaces in the always-card blocks', () => {
    const markups = [
      renderToStaticMarkup(
        <AcademicProgrammesBlockComponent
          programmes={[{ cardBackground: 'primary', title: 'MBBS' }]}
          title="Programmes"
        />,
      ),
      renderToStaticMarkup(
        <BentoGridBlockComponent
          items={[{ accentColor: 'primary', title: 'Clinical learning' }, { title: 'Research' }]}
          title="Highlights"
        />,
      ),
      renderToStaticMarkup(
        <FeatureMatrixBlockComponent
          features={[{ cardBackground: 'primary', image: media, title: 'Hospital training' }]}
          title="Features"
        />,
      ),
      renderToStaticMarkup(
        <ProfileCarouselBlockComponent
          profiles={[{ cardBackground: 'primary', image: media, name: 'Dr Example' }]}
          title="Faculty"
        />,
      ),
      renderToStaticMarkup(
        <LeadershipProfilesBlockComponent
          profiles={[{ cardBackground: 'primary', image: media, name: 'Dr Example' }]}
          title="Leadership"
        />,
      ),
      renderToStaticMarkup(
        <TeamShowcaseBlockComponent
          members={[{ cardBackground: 'primary', image: media, name: 'Dr Example' }]}
          title="Faculty"
        />,
      ),
      renderToStaticMarkup(
        <MediaCarouselBlockComponent
          items={[{ cardBackground: 'primary', media, title: 'Campus life' }]}
          title="Gallery"
        />,
      ),
    ]

    for (const html of markups) expectPrimarySurface(html)
  })

  it('themes Icon Grid cards without turning minimal items into cards', () => {
    const card = renderToStaticMarkup(
      <IconGridBlockComponent
        items={[{ cardBackground: 'brand', icon: 'Hospital', title: 'Hospital training' }]}
        title="Why choose us"
        variant="card"
      />,
    )
    const minimal = renderToStaticMarkup(
      <IconGridBlockComponent
        items={[{ cardBackground: 'primary', icon: 'Hospital', title: 'Hospital training' }]}
        title="Why choose us"
        variant="minimal"
      />,
    )

    expect(card).toContain('data-card-background="brand"')
    expect(card).toContain('bg-brand text-primary-foreground')
    expect(card).toContain('bg-primary-foreground/10 text-primary-foreground')
    expect(minimal).not.toContain('data-card-background')
  })

  it('supports section-aware surfaces on Icon Grid contact cards', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        appearance={{ background: 'subtle' }}
        items={[
          { cardBackground: 'default', icon: 'Phone', title: 'Admissions' },
          { cardBackground: 'gradient-brand', icon: 'Phone', title: 'Hospital Enquiry' },
        ]}
        variant="contactCards"
      />,
    )

    expect(html).toContain('data-card-background="default"')
    expect(html).toContain('bg-transparent text-current')
    expect(html).toContain('data-card-background="gradient-brand"')
    expect(html).toContain('bg-card-gradient-brand text-foreground')
    expect(html).toContain('bg-primary/10 text-primary')
    expect(html).not.toContain('bg-gradient-brand text-primary-foreground')
  })

  it('renders Icon Grid contact cards with multiline contact links', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        columns="3"
        items={[
          {
            description: '+91 91990 44557\n064782 99985\nadmissions@example.edu',
            icon: 'Phone',
            title: 'College Admissions',
          },
        ]}
        title="Enquiries"
        variant="contactCards"
      />,
    )

    expect(html).toContain('data-icon-grid-presentation="contactCards"')
    expect(html).toContain('font-[family-name:var(--font-display)]')
    expect(html).toContain('min-h-64')
    expect(html).toContain('href="tel:+919199044557"')
    expect(html).toContain('href="tel:06478299985"')
    expect(html).toContain('href="mailto:admissions@example.edu"')
  })

  it('renders Icon Grid items without optional section content', () => {
    const html = renderToStaticMarkup(
      <IconGridBlockComponent
        items={[
          {
            description: '+91 91990 44557',
            icon: 'Phone',
            title: 'College Admissions',
          },
        ]}
        variant="contactCards"
      />,
    )

    expect(html).toContain('College Admissions')
    expect(html).toContain('data-icon-grid-presentation="contactCards"')
    expect(html).not.toContain('mb-12')
  })

  it('themes Content Highlights cards in every presentation', () => {
    for (const layout of ['editorialRow', 'highlightsGrid', 'simpleGrid'] as const) {
      const html = renderToStaticMarkup(
        <ContentHighlightsBlockComponent
          items={[{ cardBackground: 'primary', title: 'Apply' }]}
          layout={layout}
          title="Admissions"
        />,
      )

      expectPrimarySurface(html)
    }
  })

  it('themes testimonial and award card variants without changing their row variants', () => {
    const testimonialCard = renderToStaticMarkup(
      <TestimonialGridBlockComponent
        testimonials={[{ cardBackground: 'primary', name: 'Student', quote: 'Excellent' }]}
        variant="grid"
      />,
    )
    const testimonialList = renderToStaticMarkup(
      <TestimonialGridBlockComponent
        testimonials={[{ cardBackground: 'primary', name: 'Student', quote: 'Excellent' }]}
        variant="list"
      />,
    )
    const awardCard = renderToStaticMarkup(
      <AwardsListBlockComponent
        awards={[{ cardBackground: 'primary', title: 'Accredited' }]}
        variant="cards"
      />,
    )
    const awardRows = renderToStaticMarkup(
      <AwardsListBlockComponent
        awards={[{ cardBackground: 'primary', title: 'Accredited' }]}
        variant="rows"
      />,
    )

    expectPrimarySurface(testimonialCard)
    expectPrimarySurface(awardCard)
    expect(testimonialList).not.toContain('data-card-background')
    expect(awardRows).not.toContain('data-card-background')
  })

  it('themes download and numbered-step cards without changing list or connector layouts', () => {
    const downloadCards = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="cards"
        downloads={[
          {
            cardBackground: 'primary',
            externalUrl: 'https://example.com/form.pdf',
            title: 'Application Form',
          },
        ]}
        showViewAction
      />,
    )
    const downloadList = renderToStaticMarkup(
      <DownloadListBlockComponent
        displayMode="list"
        downloads={[
          {
            cardBackground: 'primary',
            externalUrl: 'https://example.com/form.pdf',
            title: 'Application Form',
          },
        ]}
        showViewAction
      />,
    )
    const cardSteps = renderToStaticMarkup(
      <NumberedStepsBlockComponent
        steps={[{ cardBackground: 'primary', title: 'Register' }, { title: 'Apply' }]}
        title="Admissions"
        variant="cards"
      />,
    )
    const verticalSteps = renderToStaticMarkup(
      <NumberedStepsBlockComponent
        steps={[{ cardBackground: 'primary', title: 'Register' }, { title: 'Apply' }]}
        title="Admissions"
        variant="vertical"
      />,
    )

    expectPrimarySurface(downloadCards)
    expectPrimarySurface(cardSteps)
    expect(downloadList).not.toContain('data-card-background')
    expect(verticalSteps).not.toContain('data-card-background')
  })

  it('inherits a primary section in server-rendered default cards', () => {
    const markups = [
      renderToStaticMarkup(
        <IconGridBlockComponent
          appearance={{ background: 'brand' }}
          items={[{ icon: 'Hospital', title: 'Hospital training' }]}
          title="Why choose us"
          variant="card"
        />,
      ),
      renderToStaticMarkup(
        <FeatureMatrixBlockComponent
          appearance={{ background: 'brand' }}
          features={[{ image: media, title: 'Hospital training' }]}
          title="Features"
        />,
      ),
      renderToStaticMarkup(
        <ProgramMatrixBlockComponent
          appearance={{ background: 'brand' }}
          items={[{ title: 'MBBS' }]}
          title="Programmes"
        />,
      ),
      renderToStaticMarkup(
        <TestimonialGridBlockComponent
          appearance={{ background: 'brand' }}
          testimonials={[{ name: 'Student', quote: 'Excellent' }]}
          variant="grid"
        />,
      ),
    ]

    for (const html of markups) {
      expectInheritedDefaultSurface(html)
      expect(html).toContain('border-current/15')
    }
  })

  it('inherits a primary section across client-rendered default cards', () => {
    const borderedMarkups = [
      renderToStaticMarkup(
        <DownloadListBlockComponent
          appearance={{ background: 'brand' }}
          displayMode="cards"
          downloads={[{ externalUrl: 'https://example.com/form.pdf', title: 'Application Form' }]}
          showViewAction
        />,
      ),
      renderToStaticMarkup(
        <MediaCarouselBlockComponent
          appearance={{ background: 'brand' }}
          items={[{ media, title: 'Campus life' }]}
          title="Gallery"
        />,
      ),
    ]

    for (const html of borderedMarkups) {
      expectInheritedDefaultSurface(html)
      expect(html).toContain('border-current/15')
    }

    const borderlessProfile = renderToStaticMarkup(
      <ProfileCarouselBlockComponent
        appearance={{ background: 'brand' }}
        profiles={[{ image: media, name: 'Dr Example' }]}
        title="Faculty"
      />,
    )

    expectInheritedDefaultSurface(borderlessProfile)
    expect(borderlessProfile).not.toContain('border-current/15')
  })
})

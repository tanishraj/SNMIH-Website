import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TestimonialSpotlightBlockComponent } from '@/blocks/TestimonialSpotlight/Component'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { regularBlockContainerClasses } from '@/blocks/shared/blockSpacing'
import { contentSectionHeadingClasses } from '@/blocks/shared/contentStyles'

const baseProps = {
  appearance: { background: 'subtle' as const, border: 'topAndBottom' as const },
  containerBackground: 'default' as const,
  containerOutline: 'outline' as const,
  description: 'Her leadership connects education, care, and service across the institution.',
  designation: 'Founder',
  eyebrow: 'Message from management',
  image: { alt: 'Founder standing outdoors', url: '/media/founder.jpg' } as never,
  personName: 'Shri Ravindra Kumar Singh',
  testimonial:
    'Our aim is to build an institution where education, healthcare, and service strengthen one another.',
  title: 'Leadership with a long-term purpose.',
}

const getTagWithAttribute = (html: string, attribute: string) =>
  html.match(new RegExp(`<[^>]+${attribute}="[^"]*"[^>]*>`))?.[0] ?? ''

const getElementStartTag = (html: string, element: string) =>
  html.match(new RegExp(`<${element}[^>]*>`))?.[0] ?? ''

const semanticSurfaces = [
  {
    background: 'default' as const,
    divider: 'border-current/10',
    eyebrow: 'subtle',
    secondary: 'text-current',
    surface: 'bg-transparent text-current',
  },
  {
    background: 'primary' as const,
    divider: 'border-primary-foreground/15',
    eyebrow: 'brand',
    secondary: 'text-primary-foreground',
    surface: 'bg-primary text-primary-foreground',
  },
  {
    background: 'secondary' as const,
    divider: 'border-secondary-foreground/15',
    eyebrow: 'subtle',
    secondary: 'text-secondary-foreground',
    surface: 'bg-secondary text-secondary-foreground',
  },
  {
    background: 'muted' as const,
    divider: 'border-border',
    eyebrow: 'subtle',
    secondary: 'text-muted-foreground',
    surface: 'bg-muted text-foreground',
  },
  {
    background: 'accent' as const,
    divider: 'border-accent-foreground/15',
    eyebrow: 'subtle',
    secondary: 'text-accent-foreground',
    surface: 'bg-accent text-accent-foreground',
  },
]

describe('testimonial spotlight rendering', () => {
  it('renders the exact hierarchy with semantic testimonial attribution and no actions', () => {
    const html = renderToStaticMarkup(createElement(TestimonialSpotlightBlockComponent, baseProps))

    expect(html).toContain('data-testimonial-spotlight="true"')
    expect(html).toContain('data-testimonial-spotlight-background="subtle"')
    expect(html).toContain('data-testimonial-spotlight-container-background="default"')
    expect(html).toContain('data-testimonial-spotlight-container-outline="outline"')
    expect(html).toContain('data-testimonial-spotlight-media-fill="contained"')
    expect(html).toContain('data-testimonial-spotlight-media-position="left"')
    expect(html).toContain('data-testimonial-spotlight-size="default"')
    expect(html).toContain('<figure')
    expect(html).toContain('<blockquote')
    expect(html).toContain('<figcaption')
    expect(html).toContain('font-sans')
    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('data-section-eyebrow-surface="subtle"')
    expect(html).toContain('alt="Founder standing outdoors"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html.indexOf('Message from management')).toBeLessThan(
      html.indexOf('Leadership with a long-term purpose.'),
    )
    expect(html.indexOf('Leadership with a long-term purpose.')).toBeLessThan(
      html.indexOf('Our aim is to build'),
    )
    expect(html.indexOf('Our aim is to build')).toBeLessThan(
      html.indexOf('Her leadership connects'),
    )
    expect(html.indexOf('Her leadership connects')).toBeLessThan(
      html.indexOf('Shri Ravindra Kumar Singh'),
    )
    expect(html.indexOf('Shri Ravindra Kumar Singh')).toBeLessThan(html.lastIndexOf('Founder'))
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<a')
  })

  it('renders section content before the existing composition and footer actions after it', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        actions: [{ label: 'Meet our leadership', linkType: 'custom', url: '/leadership' }],
        footerActions: [
          {
            label: 'Contact the college',
            linkType: 'custom',
            mode: 'button',
            showArrow: true,
            url: '/contact',
            variant: 'primary',
          },
        ],
        sectionDescription: 'Perspectives from the people guiding our institution.',
        sectionEyebrow: 'Leadership',
        sectionTitle: 'Messages from our leadership',
      }),
    )

    const headerIndex = html.indexOf('data-testimonial-spotlight-section-header="true"')
    const compositionIndex = html.indexOf('data-testimonial-spotlight-container-background')
    const footerIndex = html.indexOf('Contact the college')

    expect(headerIndex).toBeGreaterThan(-1)
    expect(headerIndex).toBeLessThan(compositionIndex)
    expect(compositionIndex).toBeLessThan(footerIndex)
    expect(html).toContain('href="/leadership"')
    expect(html).toContain('href="/contact"')
    expect(html).toContain('data-action-mode="button"')
  })

  it.each([
    ['left', 'items-start text-left', 'justify-start'],
    ['center', 'mx-auto items-center text-center', 'justify-center'],
  ] as const)('aligns %s section content and actions', (alignment, headerClass, actionClass) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        actions: [{ label: 'Learn more', linkType: 'custom', url: '/learn' }],
        sectionContentAlignment: alignment,
        sectionTitle: 'Leadership voices',
      }),
    )
    const headerTag = getTagWithAttribute(html, 'data-testimonial-spotlight-section-header')
    const actionsTag = getTagWithAttribute(html, 'data-testimonial-spotlight-section-actions')

    expect(headerTag).toContain(`data-testimonial-spotlight-section-alignment="${alignment}"`)
    expect(headerTag).toContain(headerClass)
    expect(actionsTag).toContain(actionClass)
  })

  it('resolves outer and inner eyebrows against their independent surfaces', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        appearance: { background: 'brand', border: 'none' },
        containerBackground: 'muted',
        sectionEyebrow: 'Leadership',
      }),
    )

    const outerIndex = html.indexOf('data-section-eyebrow-surface="brand"')
    const innerIndex = html.indexOf('data-section-eyebrow-surface="subtle"')
    expect(outerIndex).toBeGreaterThan(-1)
    expect(outerIndex).toBeLessThan(innerIndex)
  })

  it('uses an outer h2 and visually identical inner h3 only when a section title exists', () => {
    const withSectionTitle = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        sectionTitle: 'Leadership voices',
      }),
    )
    const withoutSectionTitle = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        sectionEyebrow: 'Leadership',
      }),
    )

    expect(withSectionTitle).toContain(
      `<h2 class="${contentSectionHeadingClasses}">Leadership voices</h2>`,
    )
    expect(withSectionTitle).toContain(
      `<h3 class="${contentSectionHeadingClasses}">${baseProps.title}</h3>`,
    )
    expect(withoutSectionTitle).toContain(
      `<h2 class="${contentSectionHeadingClasses}">${baseProps.title}</h2>`,
    )
    expect(withoutSectionTitle).not.toContain('<h3')
  })

  it('preserves the legacy branch when every new field is absent or invalid', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        actions: [{ label: 'Broken', linkType: 'custom', url: '' }],
        footerActions: [{ label: 'Broken footer', linkType: 'custom', url: '' }],
        sectionDescription: '   ',
        sectionEyebrow: '',
        sectionTitle: null,
      }),
    )

    expect(html).not.toContain('data-testimonial-spotlight-section-header')
    expect(html).not.toContain('data-testimonial-spotlight-section-actions')
    expect(html).not.toContain('Broken')
    expect(html).not.toContain('<h3')
    expect(html).toContain('py-12')
    expect(html).toContain(`<h2 class="${contentSectionHeadingClasses}">${baseProps.title}</h2>`)
  })

  it.each(['contained', 'containedFill', 'edgeToEdge'] as const)(
    'keeps section chrome ordered and contained in %s mode',
    (mediaFillMode) => {
      const html = renderToStaticMarkup(
        createElement(TestimonialSpotlightBlockComponent, {
          ...baseProps,
          footerActions: [{ label: 'Contact us', linkType: 'custom', url: '/contact' }],
          mediaFillMode,
          sectionTitle: 'Leadership voices',
        }),
      )

      expect(html.indexOf('Leadership voices')).toBeLessThan(
        html.indexOf('data-testimonial-spotlight-container-background'),
      )
      expect(html.indexOf('data-testimonial-spotlight-container-background')).toBeLessThan(
        html.indexOf('Contact us'),
      )
      expect(html).toContain(regularBlockContainerClasses)
      if (mediaFillMode === 'edgeToEdge') {
        expect(html).toContain('data-testimonial-spotlight-media-fill="edgeToEdge"')
        expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4 mb-12')
      }
    },
  )

  it('mirrors a right-side image on desktop while keeping media first in source order', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        contentVerticalAlignment: 'top',
        imagePosition: 'right',
        mediaPosition: 'right',
      }),
    )

    expect(html).toContain('data-testimonial-spotlight-media-position="right"')
    expect(html).toContain('data-testimonial-spotlight-image-position="right"')
    expect(html).toContain('data-testimonial-spotlight-content-vertical-alignment="top"')
    expect(html).toContain('md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
    expect(html).toContain('md:order-2')
    expect(html).toContain('object-[right_center]')
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('<h2'))
  })

  it.each(['containedFill', 'edgeToEdge'] as const)(
    'supports the %s fill contract with mobile and desktop padding',
    (mediaFillMode) => {
      const html = renderToStaticMarkup(
        createElement(TestimonialSpotlightBlockComponent, {
          ...baseProps,
          mediaFillMode,
          size: 'comfortable',
        }),
      )

      expect(html).toContain(`data-testimonial-spotlight-media-fill="${mediaFillMode}"`)
      expect(html).toContain(`data-testimonial-spotlight-media-frame="${mediaFillMode}"`)
      expect(html).toContain('py-20 md:py-0')
      expect(html).toContain('md:py-16')
      expect(html).toContain('object-cover')
      if (mediaFillMode === 'edgeToEdge') {
        expect(html).toContain('px-4 pt-8 md:px-8 md:py-16 lg:px-12')
      } else {
        expect(html).toContain('p-8 md:px-8 md:py-16 lg:px-12')
      }
    },
  )

  it('omits optional fields cleanly and fails safely when required content is unresolved', () => {
    const minimal = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        image: baseProps.image,
        personName: baseProps.personName,
        testimonial: baseProps.testimonial,
        title: baseProps.title,
      }),
    )
    const missingMedia = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        personName: baseProps.personName,
        testimonial: baseProps.testimonial,
        title: baseProps.title,
      }),
    )

    expect(minimal).not.toContain('<p></p>')
    expect(missingMedia).toBe('')
  })

  it.each([undefined, null, '', '   '] as const)(
    'keeps the block visible without quotation semantics for testimonial %s',
    (testimonial) => {
      const html = renderToStaticMarkup(
        createElement(TestimonialSpotlightBlockComponent, {
          ...baseProps,
          testimonial,
        }),
      )

      expect(html).toContain('data-testimonial-spotlight="true"')
      expect(html).toContain('Leadership with a long-term purpose.')
      expect(html).toContain(
        'Her leadership connects education, care, and service across the institution.',
      )
      expect(html).toContain('Shri Ravindra Kumar Singh')
      expect(html).toContain('Founder')
      expect(html).not.toContain('<figure')
      expect(html).not.toContain('<blockquote')
      expect(html).not.toContain('<figcaption')
      expect(html).not.toContain('“')
      expect(html).not.toContain('”')
    },
  )

  it('renders through production and live-preview block pipelines', () => {
    const block = { ...baseProps, blockType: 'testimonialSpotlight' } as never
    const production = renderToStaticMarkup(renderPageBlocks([block]))
    const preview = renderToStaticMarkup(
      renderLivePreviewPageBlocks([block], {} as never, {} as never, [], []),
    )

    expect(production).toContain('data-page-block-stack="true"')
    expect(production).toContain('data-testimonial-spotlight="true"')
    expect(preview).toContain('data-page-block-stack="true"')
    expect(preview).toContain('data-testimonial-spotlight="true"')
  })

  it.each(semanticSurfaces)(
    'applies the $background semantic surface and outline to the complete inner split',
    ({ background, divider, eyebrow, secondary, surface }) => {
      const html = renderToStaticMarkup(
        createElement(TestimonialSpotlightBlockComponent, {
          ...baseProps,
          appearance: { ...baseProps.appearance, border: 'none' },
          containerBackground: background,
        }),
      )
      const sectionTag = getTagWithAttribute(html, 'data-testimonial-spotlight')
      const containerTag = getTagWithAttribute(
        html,
        'data-testimonial-spotlight-container-background',
      )

      expect(containerTag).toContain(
        `data-testimonial-spotlight-container-background="${background}"`,
      )
      expect(containerTag).toContain('data-testimonial-spotlight-container-outline="outline"')
      expect(containerTag).toContain(surface)
      expect(containerTag).toMatch(/class="[^"]*\bborder\b/)
      expect(containerTag).toContain(divider)
      expect(containerTag).toContain('overflow-hidden')
      expect(containerTag).toContain('rounded-card')
      expect(containerTag).not.toContain('rounded-[var(--radius)]')
      expect(html).toContain(secondary)
      expect(html).toContain(`data-section-eyebrow-surface="${eyebrow}"`)
      expect(sectionTag).not.toContain(surface)
      expect(sectionTag).not.toContain(divider)
    },
  )

  it('keeps missing legacy container values visually untreated', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        containerBackground: undefined,
        containerOutline: undefined,
      }),
    )
    const containerTag = getTagWithAttribute(
      html,
      'data-testimonial-spotlight-container-background',
    )

    expect(containerTag).toContain('data-testimonial-spotlight-container-background="default"')
    expect(containerTag).toContain('data-testimonial-spotlight-container-outline="none"')
    expect(containerTag).toContain('bg-transparent text-current')
    expect(containerTag).not.toContain('rounded-[var(--radius)]')
    expect(containerTag).not.toMatch(/class="[^"]*\bborder\b/)
    expect(html).toContain('data-section-eyebrow-surface="subtle"')
  })

  it('allows the inner outline to be disabled without removing its explicit surface', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        containerBackground: 'primary',
        containerOutline: 'none',
      }),
    )
    const containerTag = getTagWithAttribute(
      html,
      'data-testimonial-spotlight-container-background',
    )

    expect(containerTag).toContain('bg-primary text-primary-foreground')
    expect(containerTag).toContain('data-testimonial-spotlight-container-outline="none"')
    expect(containerTag).toContain('overflow-hidden')
    expect(containerTag).toContain('rounded-card')
    expect(containerTag).not.toContain('rounded-[var(--radius)]')
    expect(containerTag).not.toContain('border-primary-foreground/15')
  })

  it('preserves the legacy contained-fill spacing when container controls are missing', () => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        containerBackground: undefined,
        containerOutline: undefined,
        mediaFillMode: 'containedFill',
      }),
    )

    expect(html).toContain('pt-8 md:px-8 md:py-16 lg:px-12')
    expect(html).not.toContain('p-8 md:px-8 md:py-16 lg:px-12')
  })

  it('uses sans-serif testimonial copy with distinct name and designation roles', () => {
    const html = renderToStaticMarkup(createElement(TestimonialSpotlightBlockComponent, baseProps))
    const blockquoteTag = getElementStartTag(html, 'blockquote')

    expect(blockquoteTag).toContain('font-sans')
    expect(blockquoteTag).toContain('text-lg')
    expect(blockquoteTag).toContain('sm:text-xl')
    expect(blockquoteTag).not.toContain('sm:text-2xl')
    expect(blockquoteTag).not.toContain('lg:text-[1.75rem]')
    expect(blockquoteTag).toContain('leading-relaxed')
    expect(blockquoteTag).toContain('font-medium')
    expect(blockquoteTag).not.toContain('var(--font-display)')
    expect(blockquoteTag).not.toContain('font-mono')
    expect(html).toContain(
      '<span class="text-base font-semibold text-current">Shri Ravindra Kumar Singh</span>',
    )
    expect(html).toContain('<span class="text-xs leading-4 text-current">Founder</span>')
  })

  it.each([
    ['Our shared purpose.', '“Our shared purpose.”'],
    ['"Our shared purpose."', '“Our shared purpose.”'],
    ['“Our shared purpose.”', '“Our shared purpose.”'],
    ['Our “shared” purpose.', '“Our “shared” purpose.”'],
  ] as const)('renders one canonical quote pair for %s', (testimonial, expected) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        testimonial,
      }),
    )

    expect(html).toContain('<blockquote')
    expect(html).toContain(`>${expected}</blockquote>`)
  })

  it.each([
    ['"An intentionally unmatched quotation.', '“&quot;An intentionally unmatched quotation.”'],
    ['"', '“&quot;”'],
  ] as const)('preserves unmatched quotation marks in %s', (testimonial, expected) => {
    const html = renderToStaticMarkup(
      createElement(TestimonialSpotlightBlockComponent, {
        ...baseProps,
        testimonial,
      }),
    )

    expect(html).toContain(`>${expected}</blockquote>`)
  })

  it('stays server-only and avoids viewport-width overflow utilities', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TestimonialSpotlight/Component.tsx'),
      'utf8',
    )

    expect(source).not.toContain("'use client'")
    expect(source).not.toContain('w-screen')
    expect(source).not.toContain('w-[100vw]')
  })
})

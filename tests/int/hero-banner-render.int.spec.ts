import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeroBannerBlockComponent } from '@/blocks/HeroBanner/Component'

describe('Hero Banner block', () => {
  it('emits a preload only when the renderer requests it', () => {
    const eager = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        preload: true,
        title: 'Campus',
      }),
    )
    const lazy = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        title: 'Campus',
      }),
    )

    expect(eager).toContain('<link rel="preload" as="image"')
    expect(eager.match(/fetchPriority="high"/g)).toHaveLength(2)
    expect(lazy).not.toContain('<link rel="preload" as="image"')
    expect(lazy).not.toContain('fetchPriority="high"')
  })

  it('renders image, eyebrow, title, description, and two CTA buttons', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        appearance: {
          background: 'brand',
          border: 'topAndBottom',
        },
        backgroundImage: { alt: 'Campus facade', url: '/media/campus.jpg' } as never,
        buttons: [
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          { label: 'Explore programs', linkType: 'custom', url: '/programs', variant: 'secondary' },
        ] as never,
        contentWidth: 'wide',
        description: 'Train across four rigorous years of science, practice, and reflection.',
        eyebrow: 'Est. 1912 · Cambridge Heights',
        height: 'immersive',
        horizontalAlignment: 'left',
        overlayStyle: 'darker',
        title: 'Medicine, practiced with rigor and mercy.',
        verticalAlignment: 'center',
      }),
    )

    expect(html).toContain('Campus facade')
    expect(html).toContain('Est. 1912 · Cambridge Heights')
    expect(html).toContain('Medicine, practiced with rigor and mercy.')
    expect(html).toContain('Train across four rigorous years of science, practice, and reflection.')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('href="/programs"')
    expect(html).toContain('data-hero-banner-content-width="wide"')
    expect(html).toContain('data-hero-banner-height="immersive"')
    expect(html).toContain('data-hero-banner-background="brand"')
    expect(html).toContain('data-hero-banner-theme="auto"')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
    expect(html).toContain('bg-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain(
      'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
    )
    expect(html).toContain('border-y border-border')
    expect(html).toContain('bg-primary/94')
    expect(html).toContain('flex w-full flex-col gap-8 max-w-5xl')
    expect(html).toContain('flex flex-col gap-6')
    expect(html).toContain('text-balance')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('lg:text-xl')
    expect(html).toContain('h-12 w-full sm:w-auto')
  })

  it('uses stable dark copy and theme-aligned Light overlay copy', () => {
    const darkHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Lecture hall', url: '/media/lecture.jpg' } as never,
        buttons: [
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          { label: 'Compare programs', linkType: 'custom', url: '/programs', variant: 'outline' },
        ] as never,
        description: 'Deliberate contrast regardless of site theme.',
        eyebrow: 'Admissions',
        overlayStyle: 'dark',
        themeMode: 'dark',
        title: 'Dark hero tone.',
      }),
    )

    const lightHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Quad', url: '/media/quad.jpg' } as never,
        buttons: [
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          { label: 'Learn more', linkType: 'custom', url: '/learn', variant: 'outline' },
        ] as never,
        description: 'Theme mode remains explicit while the overlay stays navy.',
        eyebrow: 'Admissions',
        overlayStyle: 'light',
        themeMode: 'light',
        title: 'Light hero tone.',
      }),
    )

    expect(darkHtml).toContain('data-hero-banner-theme="dark"')
    expect(darkHtml).toContain('data-section-eyebrow-surface="darkOverlay"')
    expect(darkHtml).toContain('bg-black/74')
    expect(darkHtml).toContain('text-white')
    expect(darkHtml).toContain('text-white/82')
    expect(darkHtml).toContain(
      'bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_8%)]',
    )
    expect(darkHtml).toContain('border-primary/70 bg-transparent text-primary hover:border-primary')

    expect(lightHtml).toContain('data-hero-banner-theme="light"')
    expect(lightHtml).toContain('data-hero-banner-overlay="light"')
    expect(lightHtml).toContain('data-section-eyebrow-surface="lightOverlay"')
    expect(lightHtml).toContain('bg-white/80')
    expect(lightHtml).toContain('text-light-overlay-foreground')
    expect(lightHtml).not.toContain('text-black')
    expect(lightHtml).toContain(
      'bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_8%)]',
    )
    expect(lightHtml).toContain(
      'border-primary/70 bg-transparent text-primary hover:border-primary',
    )
  })

  it('restores the legacy Dark + Light default-direction overlay', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Operating theatre', url: '/media/theatre.jpg' } as never,
        overlayCoverage: 'full',
        overlayDirection: 'vertical',
        overlayStyle: 'light',
        themeMode: 'dark',
        title: 'Learn medicine. Serve humanity.',
      }),
    )

    expect(html).toContain('data-hero-banner-theme="dark"')
    expect(html).toContain('data-hero-banner-overlay="light"')
    expect(html).toContain('data-hero-banner-overlay-direction="vertical"')
    expect(html).toContain('data-hero-banner-overlay-coverage="full"')
    expect(html).toContain('absolute inset-0 bg-linear-to-b from-black/56 via-black/42 to-black/62')
    expect(html).not.toContain('absolute inset-0 bg-black/64')
  })

  it('maps legacy darkest overlay content to the develop branch darker style', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        overlayDirection: 'leftToRight',
        overlayStyle: 'darkest',
        title: 'A focused learning environment.',
      }),
    )

    expect(html).toContain('data-hero-banner-overlay="darker"')
    expect(html).toContain('bg-linear-to-r')
    expect(html).toContain('from-black/94')
    expect(html).toContain('via-black/74')
    expect(html).toContain('to-transparent')
  })

  it.each([
    ['vertical', 'bg-black/74'],
    ['leftToRight', 'bg-linear-to-r from-black/86'],
    ['rightToLeft', 'bg-linear-to-l from-black/86'],
    ['bottomToTop', 'bg-linear-to-t from-black/86'],
    ['topToBottom', 'bg-linear-to-b from-black/86'],
  ] as const)('renders the %s overlay direction', (overlayDirection, classes) => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        overlayDirection,
        overlayStyle: 'dark',
        title: 'A clear path into medicine.',
      }),
    )

    expect(html).toContain(`data-hero-banner-overlay-direction="${overlayDirection}"`)
    expect(html).toContain(classes)
    expect(html).toContain('text-white')
  })

  it('frames split coverage at the strong edge and normalizes Even to full coverage', () => {
    const splitHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        overlayCoverage: 'split',
        overlayDirection: 'rightToLeft',
        title: 'A focused split treatment.',
      }),
    )
    const evenHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        overlayCoverage: 'split',
        overlayDirection: 'vertical',
        title: 'An even treatment.',
      }),
    )

    expect(splitHtml).toContain('data-hero-banner-overlay-coverage="split"')
    expect(splitHtml).toContain('inset-y-0 right-0 w-1/2 bg-linear-to-l')
    expect(evenHtml).toContain('data-hero-banner-overlay-coverage="full"')
    expect(evenHtml).toContain('absolute inset-0 bg-black/74')
  })

  it('maps overlay and alignment presets into deterministic class hooks', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Library exterior', url: '/media/library.jpg' } as never,
        height: 'compact',
        horizontalAlignment: 'right',
        overlayStyle: 'dark',
        title: 'A precise place to begin.',
        verticalAlignment: 'bottom',
      }),
    )

    expect(html).toContain('data-hero-banner-overlay="dark"')
    expect(html).toContain('data-hero-banner-horizontal="right"')
    expect(html).toContain('data-hero-banner-vertical="bottom"')
    expect(html).toContain('data-hero-banner-height="compact"')
    expect(html).toContain('text-3xl sm:text-4xl md:text-5xl')
  })

  it('collapses optional content cleanly when eyebrow, description, and buttons are omitted', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Clinic hall', url: '/media/clinic.jpg' } as never,
        title: 'Built for decisive practice.',
      }),
    )

    expect(html).toContain('Built for decisive practice.')
    expect(html).not.toContain('data-hero-banner-eyebrow')
    expect(html).not.toContain('data-hero-banner-description')
    expect(html).not.toContain('data-hero-banner-actions')
  })

  it('renders arrows only for opted-in button CTAs and keeps link CTAs editorial', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        buttons: [
          {
            label: 'Apply now',
            linkType: 'custom',
            showArrow: true,
            url: '/apply',
            variant: 'default',
          },
          {
            label: 'Read more',
            linkType: 'custom',
            showArrow: true,
            url: '/read',
            variant: 'link',
          },
        ] as never,
        title: 'Study medicine.',
      }),
    )

    expect(html.match(/data-action-arrow="true"/g) ?? []).toHaveLength(1)
    expect(html).toContain('data-content-link="true"')
  })

  it('applies the optional text shadow to dark-overlay copy and editorial links only', () => {
    const shadowedHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        buttons: [
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          { label: 'Read more', linkType: 'custom', url: '/read', variant: 'link' },
        ] as never,
        description: 'Clinical learning grounded in service.',
        enableTextShadow: true,
        eyebrow: 'Admissions',
        overlayStyle: 'dark',
        title: 'Study medicine with purpose.',
      }),
    )
    const unshadowedHtml = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
        overlayStyle: 'dark',
        title: 'Study medicine with purpose.',
      }),
    )

    expect((shadowedHtml.match(/text-shadow:0 2px 12px rgb\(0 0 0 \/ 55%\)/g) ?? []).length).toBe(4)
    expect(shadowedHtml).toContain('filter:drop-shadow(0 2px 6px rgb(0 0 0 / 55%))')
    expect(shadowedHtml).not.toMatch(/<a[^>]*href="\/apply"[^>]*text-shadow/)
    expect(unshadowedHtml).not.toContain('text-shadow:')
  })

  it.each([
    ['left', 'justify-start', 'mr-auto'],
    ['center', 'justify-center', 'mx-auto'],
    ['right', 'justify-end', 'ml-auto'],
  ] as const)(
    'aligns the complete Hero Banner content axis to %s',
    (horizontalAlignment, shellClass, constrainedItemClass) => {
      const html = renderToStaticMarkup(
        createElement(HeroBannerBlockComponent, {
          backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
          buttons: [
            { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          ] as never,
          contentWidth: 'wide',
          description: 'A deliberately constrained description.',
          eyebrow: 'Admissions',
          horizontalAlignment,
          title: 'A deliberately constrained title.',
        }),
      )

      expect(html).toContain(`data-hero-banner-horizontal="${horizontalAlignment}"`)
      expect(html).toContain(shellClass)
      expect(html).toContain('flex w-full flex-col gap-8 max-w-5xl')
      expect(html).toMatch(new RegExp(`<h1 class="[^"]*${constrainedItemClass}`))
      expect(html).toMatch(
        new RegExp(
          `<p class="[^"]*${constrainedItemClass}[^"]*" data-hero-banner-description="true"`,
        ),
      )
      expect(html).toMatch(
        new RegExp(`<div class="[^"]*${shellClass}[^"]*" data-hero-banner-actions="true"`),
      )
    },
  )
})

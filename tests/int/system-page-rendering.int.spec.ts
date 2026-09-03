import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DefaultNotFoundPage, SystemModeFallbackPage } from '@/app/(frontend)/SystemFallbackPage'
import { System404BlockComponent } from '@/blocks/System404/Component'
import { SystemComingSoonBlockComponent } from '@/blocks/SystemComingSoon/Component'
import { SystemMaintenanceBlockComponent } from '@/blocks/SystemMaintenance/Component'

describe('system page rendering', () => {
  it('renders the 404 block with the dedicated centered not-found layout', () => {
    const html = renderToStaticMarkup(
      createElement(System404BlockComponent, {
        appearance: {
          background: 'subtle',
          border: 'topAndBottom',
        },
        badge: '404',
        heading: "We couldn't find that page",
        description: 'The page has moved.',
        id: 'system-404',
        primaryAction: null,
        secondaryAction: null,
        supportingNote: null,
      } as never),
    )

    expect(html).toContain('data-system-page-root="true"')
    expect(html).toContain('data-system-page-variant="notFound"')
    expect(html).toContain('min-h-dvh')
    expect(html).toContain('justify-center')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-y border-border')
    expect(html).toContain('text-center')
    expect(html).toContain('animate-[fade-in_.7s_ease-out_both]')
    expect(html).toContain('animate-[fade-in_.7s_ease-out_.12s_both]')
    expect(html).toContain('animate-[fade-in_.7s_ease-out_.2s_both]')
    expect(html).toContain('text-[clamp(4rem,15vw,7rem)]')
  })

  it('renders the maintenance block through the dedicated maintenance view', () => {
    const html = renderToStaticMarkup(
      createElement(SystemMaintenanceBlockComponent, {
        badge: 'Maintenance',
        description: 'We are applying updates.',
        heading: 'Scheduled maintenance',
        id: 'system-maintenance',
        primaryAction: null,
        secondaryAction: null,
        supportingNote: 'Support remains available by email.',
      } as never),
    )

    expect(html).toContain('data-system-page-root="true"')
    expect(html).toContain('data-system-page-variant="maintenance"')
    expect(html).toContain('Scheduled maintenance')
    expect(html).toContain('Support remains available by email.')
    expect(html).toContain('min-h-dvh')
    expect(html).toContain('text-[clamp(4rem,15vw,7rem)]')
  })

  it('renders the coming soon block through the dedicated coming-soon view', () => {
    const html = renderToStaticMarkup(
      createElement(SystemComingSoonBlockComponent, {
        badge: 'Coming Soon',
        description: 'A refreshed campus experience is on the way.',
        heading: 'New site in progress',
        id: 'system-coming-soon',
        primaryAction: null,
        secondaryAction: null,
        supportingNote: null,
      } as never),
    )

    expect(html).toContain('data-system-page-root="true"')
    expect(html).toContain('data-system-page-variant="comingSoon"')
    expect(html).toContain('New site in progress')
    expect(html).toContain('min-h-dvh')
    expect(html).toContain('text-[clamp(4rem,15vw,7rem)]')
  })

  it('keeps the built-in fallback screens available without custom system pages', () => {
    const maintenanceHtml = renderToStaticMarkup(
      createElement(SystemModeFallbackPage, {
        mode: 'maintenance',
      }),
    )
    const notFoundHtml = renderToStaticMarkup(createElement(DefaultNotFoundPage))

    expect(maintenanceHtml).toContain('data-system-page-root="true"')
    expect(maintenanceHtml).toContain('This website is temporarily unavailable')
    expect(maintenanceHtml).not.toContain('data-system-page-variant="notFound"')
    expect(notFoundHtml).toContain('Go to homepage')
    expect(notFoundHtml).toContain("We couldn&#x27;t find that page")
    expect(notFoundHtml).toContain('data-system-page-variant="notFound"')
  })
})

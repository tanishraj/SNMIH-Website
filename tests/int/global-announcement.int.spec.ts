// @vitest-environment jsdom
import fs from 'node:fs'
import path from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { GlobalAnnouncement } from '@/components/global/GlobalAnnouncement'
import { PageSettings } from '@/globals/PageSettings'

describe('global announcement settings', () => {
  afterEach(() => {
    cleanup()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('keeps announcement fields inside Website Defaults instead of a separate global', () => {
    const payloadConfigSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/payload.config.ts'),
      'utf8',
    )

    expect(payloadConfigSource).not.toContain("import { AnnouncementSettings } from './globals/AnnouncementSettings'")
    expect(payloadConfigSource).not.toContain('AnnouncementSettings,')
  })

  it('defines the announcement schema inside Website Defaults', () => {
    expect(PageSettings.slug).toBe('page-settings')

    const tabsField = PageSettings.fields.find(
      (field) => typeof field === 'object' && field !== null && 'tabs' in field,
    ) as { tabs: Array<{ label: string; fields: unknown[] }> } | undefined
    const announcementTab = tabsField?.tabs.find((tab) => tab.label === 'Announcement')
    const announcementFields = announcementTab?.fields ?? []

    const enabledField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementEnabled',
    ) as { defaultValue?: boolean; type?: string } | undefined
    const labelField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementLabel',
    ) as { label?: string; type?: string } | undefined
    const displayModeField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementDisplayMode',
    ) as { defaultValue?: string; label?: string; options?: Array<{ value: string }>; type?: string } | undefined
    const intervalField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementIntervalMs',
    ) as { defaultValue?: number; min?: number; type?: string } | undefined
    const marqueeDurationField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementMarqueeDurationMs',
    ) as { defaultValue?: number; type?: string } | undefined
    const itemsField = announcementFields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'announcementItems',
    ) as { minRows?: number; type?: string } | undefined

    expect(enabledField?.type).toBe('checkbox')
    expect(enabledField?.defaultValue).toBe(false)
    expect(labelField?.type).toBe('text')
    expect(labelField?.label).toBe('Label')
    expect(displayModeField?.type).toBe('select')
    expect(displayModeField?.label).toBe('Animation Mode')
    expect(displayModeField?.defaultValue).toBe('vertical')
    expect(displayModeField?.options?.map((option) => option.value)).toEqual([
      'vertical',
      'horizontal',
      'marquee',
    ])
    expect(intervalField?.type).toBe('number')
    expect(intervalField?.defaultValue).toBe(4000)
    expect(intervalField?.min).toBeUndefined()
    expect(marqueeDurationField?.type).toBe('number')
    expect(marqueeDurationField?.defaultValue).toBe(18000)
    expect(itemsField?.type).toBe('array')
    expect(itemsField?.minRows).toBe(1)
  })

  it('renders nothing when no valid global announcement items are available', () => {
    expect(renderToStaticMarkup(createElement(GlobalAnnouncement, { items: null }))).toBe('')
    expect(
      renderToStaticMarkup(
        createElement(GlobalAnnouncement, {
          items: [{ title: '   ', description: '   ' }],
        }),
      ),
    ).toBe('')
  })

  it('renders the announcement icon, optional title, and item description', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalAnnouncement, {
        appearance: {
          background: 'subtle',
          border: 'topAndBottom',
        },
        displayMode: 'horizontal',
        intervalMs: 4000,
        items: [{ title: 'Maintenance', description: 'Scheduled tonight at 10:00 PM.' }],
        label: 'Important',
      }),
    )

    expect(html).toContain('lucide-megaphone')
    expect(html).toContain('Important')
    expect(html).toContain('Maintenance')
    expect(html).toContain('Scheduled tonight at 10:00 PM.')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-border')
  })

  it('renders a linked description and does not require a title', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalAnnouncement, {
        intervalMs: 4000,
        items: [{ description: 'Read update', url: '/updates' }],
      }),
    )

    expect(html).not.toContain('—')
    expect(html).toContain('href="/updates"')
    expect(html).toContain('Read update')
  })

  it('renders the global announcement as sticky with the provided toolbar offset', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalAnnouncement, {
        intervalMs: 4000,
        items: [{ title: 'Maintenance', description: 'Scheduled tonight at 10:00 PM.' }],
        stickyTopOffset: '3rem',
      }),
    )

    expect(html).toContain('position:sticky')
    expect(html).toContain('top:3rem')
  })

  it('lets the announcement scroll away when hide on scroll is enabled', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalAnnouncement, {
        hideOnScroll: true,
        items: [{ description: 'Scheduled maintenance tonight.' }],
        stickyTopOffset: '3rem',
      }),
    )

    expect(html).not.toContain('position:sticky')
    expect(html).not.toContain('top:3rem')
  })

  it('dismisses for the current render when session storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    render(
      createElement(GlobalAnnouncement, {
        dismissible: true,
        items: [{ description: 'Scheduled maintenance tonight.' }],
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }))

    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull()
  })

  it('wires the frontend layout to fetch and render the announcement global', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'), 'utf8')

    expect(layoutSource).toContain("import { GlobalAnnouncement } from '@/components/global/GlobalAnnouncement'")
    expect(layoutSource).toContain("slug: 'page-settings'")
    expect(layoutSource).toContain('<GlobalAnnouncement')
    expect(layoutSource).toContain(
      'const announcementSettings = pageSettings?.announcementEnabled ? pageSettings : null',
    )
    expect(layoutSource).toContain(
      'const announcementDisplayMode = announcementSettings?.announcementDisplayMode',
    )
    expect(layoutSource).toContain(
      'const announcementIntervalMs = announcementSettings?.announcementIntervalMs',
    )
    expect(layoutSource).toContain('const announcementLabel = announcementSettings?.announcementLabel')
    expect(layoutSource).toContain(
      'const announcementMarqueeDurationMs = announcementSettings?.announcementMarqueeDurationMs',
    )
    expect(layoutSource).toContain('const announcementItems = announcementSettings?.announcementItems')
    expect(layoutSource).toContain('displayMode={announcementDisplayMode}')
    expect(layoutSource).toContain('intervalMs={announcementIntervalMs}')
    expect(layoutSource).toContain('items={announcementItems}')
    expect(layoutSource).toContain('label={announcementLabel}')
    expect(layoutSource).toContain('marqueeDurationMs={announcementMarqueeDurationMs}')
    expect(layoutSource).toContain('stickyTopOffset={cmsToolbarOffset}')
  })
})

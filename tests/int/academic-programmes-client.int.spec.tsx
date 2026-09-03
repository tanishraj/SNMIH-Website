// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('lucide-react/dynamic', () => ({
  DynamicIcon: ({ name }: { name: string }) => <svg aria-hidden="true" data-dynamic-icon={name} />,
  dynamicIconImports: {
    'book-open': () => Promise.resolve({}),
    'graduation-cap': () => Promise.resolve({}),
    'indian-rupee': () => Promise.resolve({}),
    users: () => Promise.resolve({}),
  },
}))

import { AcademicProgrammesClient } from '@/blocks/AcademicProgrammes/AcademicProgrammesClient'

afterEach(() => {
  cleanup()
})

const programmes = [
  {
    ctaLabel: 'Explore programme',
    eyebrow: 'Undergraduate',
    facts: [],
    id: 'mbbs',
    openInNewTab: false,
    title: 'MBBS',
  },
  {
    ctaLabel: 'Explore programme',
    eyebrow: 'undergraduate',
    facts: [],
    id: 'bsc',
    openInNewTab: false,
    title: 'BSc Medical Sciences',
  },
  {
    ctaLabel: 'Explore programme',
    eyebrow: 'Postgraduate',
    facts: [],
    id: 'md',
    openInNewTab: false,
    title: 'MD General Medicine',
  },
  {
    ctaLabel: 'Explore programme',
    facts: [],
    id: 'fellowship',
    openInNewTab: false,
    title: 'Clinical Fellowship',
  },
]

describe('Academic Programmes client presentation', () => {
  it('deduplicates categories case-insensitively and filters programmes', () => {
    render(
      <AcademicProgrammesClient
        background="none"
        columns="3"
        contentAlignment="left"
        metadataPosition="flow"
        programmes={programmes}
        showFilter
        viewMode="grid"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'Undergraduate',
      'Postgraduate',
    ])

    fireEvent.click(screen.getByRole('tab', { name: 'Postgraduate' }))

    expect(screen.getByRole('heading', { name: 'MD General Medicine' })).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'MBBS' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Clinical Fellowship' })).toBeNull()
  })

  it('omits a redundant filter when fewer than two categories exist', () => {
    render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="center"
        metadataPosition="flow"
        programmes={[
          {
            ctaLabel: 'Explore programme',
            eyebrow: 'Undergraduate',
            facts: [],
            id: 'mbbs',
            openInNewTab: false,
            title: 'MBBS',
          },
        ]}
        showFilter
        viewMode="grid"
      />,
    )

    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('heading', { name: 'MBBS' })).not.toBeNull()
  })

  it('uses the semantic card radius for every programme surface and link shell', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="left"
        metadataPosition="flow"
        programmes={[
          {
            ctaLabel: 'Explore MBBS',
            facts: [],
            href: '/programmes/mbbs',
            id: 'mbbs',
            image: { alt: 'Medical students', src: '/media/mbbs.jpg' },
            openInNewTab: false,
            title: 'MBBS',
          },
          {
            ctaLabel: 'Explore MD',
            facts: [],
            href: '/programmes/md',
            id: 'md',
            openInNewTab: false,
            title: 'MD General Medicine',
          },
        ]}
        showFilter={false}
        viewMode="grid"
      />,
    )

    const cards = Array.from(container.querySelectorAll('[data-academic-programme="true"]'))
    const mediaCard = cards.find(
      (card) => card.getAttribute('data-academic-programme-image') === 'true',
    )
    const textCard = cards.find(
      (card) => card.getAttribute('data-academic-programme-image') === 'false',
    )
    const mediaLink = mediaCard?.closest('[data-academic-programme-link="true"]')
    const textLink = textCard?.closest('[data-academic-programme-link="true"]')

    expect(mediaCard?.className).toContain('rounded-card')
    expect(mediaCard?.className).not.toContain('rounded-[var(--radius)]')
    expect(textCard?.className).toContain('rounded-card')
    expect(textCard?.className).not.toContain('rounded-[var(--radius)]')
    expect(mediaLink?.className).toContain('rounded-card')
    expect(mediaLink?.className).not.toContain('rounded-[var(--radius)]')
    expect(textLink?.className).toContain('rounded-card')
    expect(textLink?.className).not.toContain('rounded-[var(--radius)]')
  })

  it('supports keyboard navigation across filter tabs', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="3"
        contentAlignment="right"
        metadataPosition="flow"
        programmes={programmes}
        showFilter
        viewMode="grid"
      />,
    )

    const allTab = screen.getByRole('tab', { name: 'All' })
    const frame = container.querySelector('[data-scrollable-content-tab-frame="true"]')
    const viewport = container.querySelector('[data-scrollable-content-tab-viewport="true"]')
    const tablist = screen.getByRole('tablist', { name: 'Programme categories' })

    expect(frame?.className).toContain('overflow-hidden')
    expect(viewport?.className).toContain('overflow-x-auto')
    expect(viewport?.contains(tablist)).toBe(true)

    allTab.focus()
    fireEvent.keyDown(allTab, { key: 'End' })

    expect(screen.getByRole('tab', { name: 'Postgraduate' })).toBe(document.activeElement)
    expect(screen.getByRole('heading', { name: 'MD General Medicine' })).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'MBBS' })).toBeNull()
  })

  it('omits a labelled metadata item when its value is empty', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="left"
        metadataPosition="bottom"
        programmes={[
          {
            ctaLabel: 'Explore programme',
            durationLabel: 'Programme duration',
            facts: [],
            id: 'mbbs',
            intake: 'Subject to approval',
            intakeLabel: 'Availability',
            openInNewTab: false,
            title: 'MBBS',
          },
        ]}
        showFilter={false}
        viewMode="grid"
      />,
    )

    expect(screen.queryByText('Programme duration')).toBeNull()
    expect(screen.getByText('Availability')).not.toBeNull()
    expect(screen.getByText('Subject to approval')).not.toBeNull()
    expect(
      container.querySelector('[data-academic-programme-content="bottom-metadata"]'),
    ).not.toBeNull()
  })

  it('bottom-aligns an action when a programme has no metadata', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="left"
        metadataPosition="bottom"
        programmes={[
          {
            ctaLabel: 'Explore MBBS',
            facts: [],
            href: '/programmes/mbbs',
            id: 'mbbs',
            openInNewTab: false,
            title: 'MBBS',
          },
        ]}
        showFilter={false}
        viewMode="grid"
      />,
    )

    expect(
      container.querySelector('[data-academic-programme-bottom-content="true"]'),
    ).not.toBeNull()
    expect(container.querySelector('[data-academic-programme-content="standard"]')).not.toBeNull()
    const action = container.querySelector('[data-academic-programme-action="ruled"]')
    expect(action?.classList.contains('border-t')).toBe(true)
    expect(action?.querySelector('span')?.className).toContain(
      'flex w-full items-center justify-between',
    )
    expect(screen.getByText('Explore MBBS')).not.toBeNull()
    expect(container.querySelector('dl')).toBeNull()
  })

  it('keeps guaranteed space before a bottom-aligned ruled action divider', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="3"
        contentAlignment="left"
        metadataPosition="flow"
        programmes={[
          {
            ctaLabel: 'Explore MBBS',
            description: 'Build a strong foundation in medical science and clinical practice.',
            facts: [],
            href: '/programmes/mbbs',
            id: 'mbbs',
            openInNewTab: false,
            title: 'MBBS',
          },
        ]}
        showFilter={false}
        viewMode="grid"
      />,
    )

    const spacer = container.querySelector('[data-academic-programme-action-spacing="ruled"]')
    const action = container.querySelector('[data-academic-programme-action="ruled"]')

    expect(spacer?.className).toContain('mt-auto')
    expect(spacer?.className).toContain('pt-8')
    expect(spacer?.classList.contains('border-t')).toBe(false)
    expect(action?.classList.contains('border-t')).toBe(true)
    expect(action?.classList.contains('pt-5')).toBe(true)
  })

  it('places an inline action after the title when bottom metadata has no description', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="left"
        metadataPosition="bottom"
        programmes={[
          {
            ctaLabel: 'Explore MBBS',
            duration: '3 years',
            facts: [],
            href: '/programmes/mbbs',
            id: 'mbbs',
            openInNewTab: false,
            title: 'MBBS',
          },
        ]}
        showFilter={false}
        viewMode="grid"
      />,
    )

    const html = container.innerHTML
    const action = container.querySelector('[data-academic-programme-action="inline"]')
    expect(html.indexOf('MBBS')).toBeLessThan(html.indexOf('Explore MBBS'))
    expect(html.indexOf('Explore MBBS')).toBeLessThan(html.indexOf('Duration'))
    expect(action?.classList.contains('border-t')).toBe(false)
    expect(action?.querySelector('span')?.className).toContain('inline-flex items-center gap-2')
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })

  it('filters detailed cards and preserves their responsive fact layout', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="none"
        columns="2"
        contentAlignment="left"
        metadataPosition="flow"
        programmes={[
          {
            ctaLabel: 'Apply now',
            duration: '4.5 years + 1 year internship',
            eyebrow: 'Undergraduate',
            facts: [
              { icon: 'Users', label: 'Seats', value: '150' },
              { icon: 'BookOpen', label: 'Eligibility', value: '10+2 with PCB' },
              { icon: 'IndianRupee', label: 'Fee', value: 'As notified' },
            ],
            href: '/programmes/mbbs',
            icon: 'GraduationCap',
            id: 'mbbs',
            openInNewTab: false,
            title: 'MBBS',
          },
          {
            ctaLabel: 'Apply now',
            eyebrow: 'Postgraduate',
            facts: [],
            id: 'md',
            openInNewTab: false,
            title: 'MD General Medicine',
          },
        ]}
        showFilter
        viewMode="detailedCards"
      />,
    )

    expect(
      container.querySelector('[data-academic-programmes-view="detailedCards"]'),
    ).not.toBeNull()
    expect(container.querySelector('[data-academic-programme-facts="true"]')).not.toBeNull()
    expect(container.innerHTML).toContain(
      '[grid-template-columns:repeat(auto-fit,minmax(min(100%,8.5rem),1fr))]',
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Postgraduate' }))
    expect(screen.getByRole('heading', { name: 'MD General Medicine' })).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'MBBS' })).toBeNull()
  })

  it('keeps detailed cards semantic on a brand section and omits invalid icons', () => {
    const { container } = render(
      <AcademicProgrammesClient
        background="brand"
        columns="2"
        contentAlignment="left"
        metadataPosition="bottom"
        programmes={[
          {
            cardBackground: 'primary',
            ctaLabel: 'Explore programme',
            facts: [{ icon: 'NotReal', label: 'Seats', value: '42' }],
            href: '/programmes/md',
            icon: 'NotReal',
            id: 'md',
            openInNewTab: true,
            title: 'MD / MS',
          },
        ]}
        showFilter={false}
        viewMode="detailedCards"
      />,
    )

    expect(container.querySelector('dl')).not.toBeNull()
    expect(container.querySelectorAll('dt')).toHaveLength(1)
    expect(container.querySelectorAll('dd')).toHaveLength(1)
    expect(container.querySelector('[data-academic-programme-icon]')).toBeNull()
    expect(container.querySelector('[data-dynamic-icon]')).toBeNull()
    const link = container.querySelector('a')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link?.className).toContain('focus-visible:ring-3')
    expect(container.innerHTML).toContain('bg-primary text-primary-foreground')
    expect(container.innerHTML).toContain('mt-auto pt-7')
  })
})

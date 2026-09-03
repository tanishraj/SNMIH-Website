import { readFileSync } from 'node:fs'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Services21 } from '@/components/services21'

const read = (file: string) => readFileSync(file, 'utf8')

describe('theme block outliers', () => {
  it('uses paired semantic status and fixed-overlay foregrounds', () => {
    const timeline = read('src/blocks/Timeline/Component.tsx')
    const leadership = read('src/blocks/LeadershipProfiles/Component.tsx')

    expect(timeline).toContain('bg-success text-success-foreground')
    expect(timeline).not.toContain('bg-success text-white')
    expect(leadership).toContain('overlay.text.eyebrow')
    expect(leadership).not.toContain("overlay.tone === 'light' ? 'text-success'")
  })

  it('uses shared rating and logical-radius presentation in Quote', () => {
    const quote = read('src/blocks/QuoteBlock/Component.tsx')

    expect(quote).toContain('fill-rating-excellent text-rating-excellent')
    expect(quote).toContain('border-s border-primary ps-6 md:ps-8')
    expect(quote).toContain('rounded-card border border-border bg-card')
    expect(quote).not.toContain('amber-')
    expect(quote).not.toContain('border-l-4')
  })

  it('keeps the Services 21 signature action without duplicating button variants', () => {
    const block = read('src/blocks/Services21/Component.tsx')

    expect(block).toContain("resolveCardSurface('default', appearance?.background ?? 'none')")
    expect(block).toContain('actionSurface.button[actionVariant]')
    expect(block).not.toContain('buttonClassNameByVariant')
    expect(read('src/components/services21.tsx')).toContain(
      "appearanceClasses.surface === 'brand'",
    )
  })

  it('activates Services 21 choices by hover, focus, and click', () => {
    render(
      <Services21
        items={[
          {
            description: 'Care for adults and older patients.',
            id: '{01}',
            image: '/media/medicine.jpg',
            title: 'General medicine',
          },
          {
            description: 'Emergency treatment around the clock.',
            id: '{02}',
            image: '/media/emergency.jpg',
            title: 'Emergency care',
          },
        ]}
        title="Clinical services"
      />,
    )

    const medicine = screen.getByRole('button', { name: /general medicine/i })
    const emergency = screen.getByRole('button', { name: /emergency care/i })

    expect(medicine.getAttribute('aria-pressed')).toBe('true')
    expect(emergency.getAttribute('aria-pressed')).toBe('false')

    fireEvent.mouseEnter(emergency)
    expect(emergency.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Emergency treatment around the clock.')).toBeTruthy()

    fireEvent.focus(medicine)
    expect(medicine.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(emergency)
    expect(emergency.getAttribute('aria-pressed')).toBe('true')
  })
})

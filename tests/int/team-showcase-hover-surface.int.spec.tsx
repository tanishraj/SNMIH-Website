// @vitest-environment jsdom

import type { PropsWithChildren } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-image-src={src} role="img" />
  ),
}))

type MotionDivProps = PropsWithChildren<{
  className?: string
  'data-team-showcase-hover-surface'?: string
}>

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      'data-team-showcase-hover-surface': surface,
    }: MotionDivProps) => (
      <div className={className} data-team-showcase-hover-surface={surface}>
        {children}
      </div>
    ),
  },
}))

import { TeamShowcase } from '@/components/team-showcase'

afterEach(() => cleanup())

const member = {
  description: 'Supports teaching, research, and patient care.',
  image: '/team/member.jpg',
  name: 'Dr Example',
  role: 'Professor',
}

describe('Team Showcase hover surfaces', () => {
  it('raises a default member on an opaque Card surface and clears it on grid leave', () => {
    const { container } = render(
      <TeamShowcase appearance={{ background: 'subtle' }} members={[member]} />,
    )

    fireEvent.mouseEnter(container.querySelector('li') as HTMLLIElement)

    const overlay = container.querySelector('[data-team-showcase-hover-surface="default"]')
    expect(overlay?.className).toContain('bg-card text-card-foreground')
    expect(overlay?.className).toContain('hidden')
    expect(overlay?.className).toContain('md:block')

    fireEvent.mouseLeave(container.querySelector('ul') as HTMLUListElement)
    expect(container.querySelector('[data-team-showcase-hover-surface]')).toBeNull()
  })

  it('keeps an explicit Primary surface on the raised member', () => {
    const { container } = render(
      <TeamShowcase members={[{ ...member, cardBackground: 'primary' }]} />,
    )

    fireEvent.mouseEnter(container.querySelector('li') as HTMLLIElement)

    const overlay = container.querySelector('[data-team-showcase-hover-surface="primary"]')
    expect(overlay?.className).toContain('bg-primary text-primary-foreground')
  })
})

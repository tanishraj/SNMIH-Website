import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const emblaHarness = vi.hoisted(() => {
  const api = {
    canScrollNext: vi.fn(() => true),
    canScrollPrev: vi.fn(() => true),
    off: vi.fn(),
    on: vi.fn(() => api),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
  }
  const carouselRef = vi.fn()

  return { api, carouselRef }
})

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [emblaHarness.carouselRef, emblaHarness.api]),
}))

import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

describe('Carousel keyboard navigation', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('keeps Arrow navigation on by default and can explicitly disable it', () => {
    const view = render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )

    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' })
    expect(emblaHarness.api.scrollNext).toHaveBeenCalledTimes(1)

    view.rerender(
      <Carousel keyboardNavigation={false}>
        <CarouselContent>
          <CarouselItem>One</CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )

    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' })
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' })

    expect(emblaHarness.api.scrollPrev).not.toHaveBeenCalled()
    expect(emblaHarness.api.scrollNext).toHaveBeenCalledTimes(1)
  })
})

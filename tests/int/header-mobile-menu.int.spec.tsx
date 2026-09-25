import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { HeaderMobileMenu } from '@/components/header/HeaderMobileMenu'

afterEach(() => {
  cleanup()
})

const openMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  expect(screen.getByRole('dialog', { name: 'Mobile navigation' })).toBeTruthy()
}

const expectMenuToClose = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).toBeNull()
  })
}

describe('HeaderMobileMenu', () => {
  it('closes after a top-level navigation link is selected', async () => {
    render(
      <HeaderMobileMenu
        ctas={[]}
        menuItems={[{ href: '/news-events', label: 'News & Events', newTab: false }]}
      />,
    )

    openMenu()
    fireEvent.click(screen.getByRole('link', { name: 'News & Events' }))

    await expectMenuToClose()
  })

  it('closes after a nested navigation link is selected', async () => {
    render(
      <HeaderMobileMenu
        ctas={[]}
        menuItems={[
          {
            children: [{ href: '/about/overview', label: 'Overview', newTab: false }],
            href: '/about',
            label: 'About',
            newTab: false,
          },
        ]}
      />,
    )

    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'About' }))
    fireEvent.click(screen.getByRole('link', { name: 'Overview' }))

    await expectMenuToClose()
  })

  it('closes after a call-to-action link is selected', async () => {
    render(
      <HeaderMobileMenu
        ctas={[
          {
            href: '/apply',
            label: 'Apply now',
            newTab: false,
            variant: 'default',
          },
        ]}
        menuItems={[]}
      />,
    )

    openMenu()
    fireEvent.click(screen.getByRole('link', { name: 'Apply now' }))

    await expectMenuToClose()
  })
})

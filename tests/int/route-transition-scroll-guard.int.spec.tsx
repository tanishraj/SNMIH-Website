import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RouteTransitionCommitSignal,
  RouteTransitionScrollGuard,
} from '@/components/global/RouteTransitionScrollGuard'
import { HeaderNavMenu } from '@/components/header/HeaderNavMenu'

const navigation = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}))

const NavigationLink = ({ href, ...props }: React.ComponentProps<'a'> & { href: string }) => (
  <a href={href} onClick={(event) => event.preventDefault()} {...props} />
)

const scrollIntoView = vi.fn()

describe('RouteTransitionScrollGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    navigation.push.mockReset()
    window.history.replaceState(null, '', '/current')
    document.documentElement.style.removeProperty('scroll-behavior')
    scrollIntoView.mockReset()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    cleanup()
    document.documentElement.style.removeProperty('scroll-behavior')
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps the outgoing page stationary and scrolls the committed destination to the top', () => {
    const rootRectRead = vi.spyOn(document.documentElement, 'getClientRects')
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const view = render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
        <NavigationLink href="/destination">Destination</NavigationLink>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Destination' }))

    expect(document.documentElement.style.scrollBehavior).toBe('auto')
    expect(rootRectRead).toHaveBeenCalledOnce()
    expect(navigation.push).toHaveBeenCalledWith('/destination', { scroll: false })
    expect(scrollTo).not.toHaveBeenCalled()

    view.rerender(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="destination" />
        <NavigationLink href="/destination">Destination</NavigationLink>
      </>,
    )

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0, top: 0 })
    expect(document.documentElement.style.scrollBehavior).toBe('')
  })

  it('positions a cross-page fragment only after its destination has committed', () => {
    const view = render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
        <NavigationLink href="/destination#section">Destination section</NavigationLink>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Destination section' }))

    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(navigation.push).toHaveBeenCalledWith('/destination#section', { scroll: false })

    view.rerender(
      <>
        <RouteTransitionScrollGuard />
        <div id="section" />
        <RouteTransitionCommitSignal key="destination" />
      </>,
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('keeps smooth scrolling available for same-page fragment links', () => {
    render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
        <NavigationLink href="#section">Section</NavigationLink>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Section' }))

    expect(navigation.push).not.toHaveBeenCalled()
    expect(document.documentElement.style.scrollBehavior).toBe('')
  })

  it('does not focus-scroll a sticky desktop dropdown trigger on pointer activation', () => {
    render(
      <HeaderNavMenu
        menuItems={[
          {
            children: [{ href: '/mbbs-admission', label: 'MBBS Admission', newTab: false }],
            href: '/admissions',
            label: 'Admissions',
            newTab: false,
          },
        ]}
        size="default"
      />,
    )

    expect(
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Admissions' }), {
        pointerType: 'mouse',
      }),
    ).toBe(false)
  })

  it('prevents dropdown dismissal from restoring focus before cross-page navigation', () => {
    const restoreTriggerFocus = vi.fn()

    render(
      <>
        <RouteTransitionScrollGuard />
        <button type="button">Admissions</button>
        <div data-slot="navigation-menu-content">
          <NavigationLink
            href="/mbbs-admission"
            onClick={() => {
              if (document.activeElement?.closest('[data-slot="navigation-menu-content"]')) {
                restoreTriggerFocus()
              }
            }}
          >
            MBBS Admission
          </NavigationLink>
        </div>
      </>,
    )

    const admissionLink = screen.getByRole('link', { name: 'MBBS Admission' })
    admissionLink.focus()
    fireEvent.click(admissionLink)

    expect(restoreTriggerFocus).not.toHaveBeenCalled()
    expect(navigation.push).toHaveBeenCalledWith('/mbbs-admission', { scroll: false })
  })

  it('ignores modified, new-tab, download, API, Admin, and external link clicks', () => {
    render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
        <NavigationLink href="/destination">Modified</NavigationLink>
        <NavigationLink href="/destination" target="_blank">
          New tab
        </NavigationLink>
        <NavigationLink download href="/document.pdf">
          Download
        </NavigationLink>
        <NavigationLink href="/api/media/file/document.pdf">API</NavigationLink>
        <NavigationLink href="/admin">Admin</NavigationLink>
        <NavigationLink href="https://example.com">External</NavigationLink>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Modified' }), { ctrlKey: true })
    fireEvent.click(screen.getByRole('link', { name: 'New tab' }))
    fireEvent.click(screen.getByRole('link', { name: 'Download' }))
    fireEvent.click(screen.getByRole('link', { name: 'API' }))
    fireEvent.click(screen.getByRole('link', { name: 'Admin' }))
    fireEvent.click(screen.getByRole('link', { name: 'External' }))

    expect(navigation.push).not.toHaveBeenCalled()
    expect(document.documentElement.style.scrollBehavior).toBe('')
  })

  it('restores smooth-scroll eligibility if navigation is cancelled', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const view = render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
        <NavigationLink href="/destination">Destination</NavigationLink>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Destination' }))
    expect(document.documentElement.style.scrollBehavior).toBe('auto')

    act(() => vi.runOnlyPendingTimers())

    expect(document.documentElement.style.scrollBehavior).toBe('')

    view.rerender(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="unrelated-later-navigation" />
      </>,
    )

    expect(scrollTo).not.toHaveBeenCalled()
  })
})

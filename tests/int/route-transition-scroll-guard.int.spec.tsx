import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RouteTransitionCommitSignal,
  RouteTransitionScrollGuard,
} from '@/components/global/RouteTransitionScrollGuard'
import { HeaderNavMenu } from '@/components/header/HeaderNavMenu'

const navigation = vi.hoisted(() => ({ push: vi.fn(), pathname: '/current', search: '' }))

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

const NavigationLink = ({ href, ...props }: React.ComponentProps<'a'> & { href: string }) => (
  <a href={href} onClick={(event) => event.preventDefault()} {...props} />
)

const scrollIntoView = vi.fn()

describe('RouteTransitionScrollGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    navigation.push.mockReset()
    navigation.pathname = '/current'
    navigation.search = ''
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

    window.history.pushState(null, '', '/destination')
    navigation.pathname = '/destination'
    view.rerender(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal key="current" />
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

    window.history.pushState(null, '', '/destination#section')
    navigation.pathname = '/destination'
    view.rerender(
      <>
        <RouteTransitionScrollGuard />
        <div id="section" />
        <RouteTransitionCommitSignal key="current" />
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

  it.each([
    ['/news-events', '/news-events/college-fest'],
    ['/news-events/college-fest', '/news-events/annual-sports-day'],
    ['/articles/category/research', '/articles/category/campus'],
  ])('resets nested navigation from %s to %s without remounting the signal', (from, to) => {
    window.history.replaceState(null, '', from)
    navigation.pathname = from
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const tree = () => (
      <>
        <RouteTransitionScrollGuard />
        <main>{navigation.pathname}</main>
        <RouteTransitionCommitSignal />
        <NavigationLink href={to}>Next page</NavigationLink>
      </>
    )
    const view = render(tree())
    fireEvent.click(screen.getByRole('link', { name: 'Next page' }))
    expect(scrollTo).not.toHaveBeenCalled()
    view.rerender(tree())
    expect(scrollTo).not.toHaveBeenCalled()

    navigation.pathname = to
    window.history.pushState(null, '', to)
    view.rerender(tree())
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ behavior: 'auto', left: 0, top: 0 })
  })

  it('resets programmatic, history, and query navigation even without a captured link click', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const tree = () => (
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal />
      </>
    )
    const view = render(tree())

    for (const url of ['/search?q=Admission', '/search?q=Fees', '/current']) {
      const destination = new URL(url, window.location.href)
      navigation.pathname = destination.pathname
      navigation.search = destination.search
      window.history.replaceState(null, '', url)
      view.rerender(tree())
      expect(scrollTo).toHaveBeenLastCalledWith({ behavior: 'auto', left: 0, top: 0 })
    }
    expect(scrollTo).toHaveBeenCalledTimes(3)
  })

  it('uses the final redirected URL instead of the original fragment', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const tree = () => (
      <>
        <RouteTransitionScrollGuard />
        <div id="old-section" />
        <RouteTransitionCommitSignal />
        <NavigationLink href="/old-page#old-section">Redirect</NavigationLink>
      </>
    )
    const view = render(tree())
    fireEvent.click(screen.getByRole('link', { name: 'Redirect' }))
    navigation.pathname = '/new-page'
    window.history.pushState(null, '', '/new-page')
    view.rerender(tree())
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0, top: 0 })
  })

  it('returns to the top when a link to the current page has no fragment', () => {
    window.history.replaceState(null, '', '/current#section')
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    render(
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal />
        <NavigationLink href="/current">Current page</NavigationLink>
      </>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Current page' }))
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0, top: 0 })
    expect(navigation.push).toHaveBeenCalledWith('/current', { scroll: false })
  })

  it('falls back to the top when a destination fragment is missing', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const tree = () => (
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal />
      </>
    )
    const view = render(tree())
    navigation.pathname = '/destination'
    window.history.pushState(null, '', '/destination#missing')
    view.rerender(tree())
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0, top: 0 })
  })

  it('disables browser scroll restoration only while the guard is mounted', () => {
    window.history.scrollRestoration = 'auto'
    const view = render(<RouteTransitionScrollGuard />)
    expect(window.history.scrollRestoration).toBe('manual')
    view.unmount()
    expect(window.history.scrollRestoration).toBe('auto')
  })

  it('still positions a route that finishes after the scroll-style safety timeout', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const tree = () => (
      <>
        <RouteTransitionScrollGuard />
        <RouteTransitionCommitSignal />
        <NavigationLink href="/slow-page">Slow page</NavigationLink>
      </>
    )
    const view = render(tree())
    fireEvent.click(screen.getByRole('link', { name: 'Slow page' }))
    act(() => vi.advanceTimersByTime(15_000))
    expect(scrollTo).not.toHaveBeenCalled()
    navigation.pathname = '/slow-page'
    window.history.pushState(null, '', '/slow-page')
    view.rerender(tree())
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'auto', left: 0, top: 0 })
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

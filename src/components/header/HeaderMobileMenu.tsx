'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuIcon, X } from 'lucide-react'

import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import type { ResolvedHeaderLink, ResolvedHeaderMenuItem } from '@/lib/headerNavigation'

type HeaderMobileMenuProps = {
  ctas: Array<
    ResolvedHeaderLink & {
      showArrow?: boolean
      variant?: CmsActionVariant | null
    }
  >
  menuItems: ResolvedHeaderMenuItem[]
}

const topLevelLinkClasses =
  'flex h-[3.75rem] items-center border-b p-0 text-left text-base leading-[3.75] font-bold no-underline ring-ring/10 outline-ring/50 transition-all focus-visible:ring-4 focus-visible:outline-1 nth-last-1:border-0'

const childLinkClasses =
  'flex w-full min-w-fit flex-row items-center gap-2.5 rounded-control px-2 py-[5px] no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground'

export function HeaderMobileMenu({ ctas, menuItems }: HeaderMobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [sheetTopOffset, setSheetTopOffset] = useState('0px')
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const closeMenu = () => setOpen(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const triggerElement = triggerRef.current
    const headerElement = triggerElement?.closest(
      '[data-global-header="true"]',
    ) as HTMLElement | null

    if (!headerElement) {
      setSheetTopOffset('0px')
      return
    }

    let frame = 0

    const updateOffset = () => {
      frame = 0
      setSheetTopOffset(`${Math.max(0, headerElement.getBoundingClientRect().bottom)}px`)
    }

    const scheduleUpdate = () => {
      if (frame !== 0) {
        return
      }

      frame = window.requestAnimationFrame(updateOffset)
    }

    updateOffset()

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            scheduleUpdate()
          })

    observer?.observe(headerElement)

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      observer?.disconnect()
    }
  }, [open])

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <div data-header-mobile-menu="true" data-header-mobile-menu-style="navbar12" ref={triggerRef}>
        <SheetTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            className="size-11"
            type="button"
            variant="ghost"
          >
            {open ? <X className="size-5.5" /> : <MenuIcon className="size-5.5" />}
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent
        aria-describedby={undefined}
        className="inset-x-0 z-2 animate-none! bg-background p-0 [&>button]:hidden lg:hidden"
        showCloseButton={false}
        side="top"
        showOverlay={false}
        style={{
          top: sheetTopOffset,
          height: `calc(100dvh - ${sheetTopOffset})`,
        }}
      >
        <div className="relative flex h-full flex-col animate-[fade-in_.35s_ease-in-out_forwards]">
          <div className="absolute -m-px h-px w-px overflow-hidden border-0 p-0 text-nowrap whitespace-nowrap">
            <SheetTitle className="text-primary">Mobile navigation</SheetTitle>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-screen-2xl px-4">
              <nav aria-label="Mobile navigation">
                <Accordion className="w-full rounded-none border-x-0 border-t-0" type="multiple">
                  {menuItems.map((item, index) => {
                    if (item.children?.length) {
                      return (
                        <AccordionItem
                          className="data-open:bg-transparent"
                          key={`${item.label}-${item.href}-${index}`}
                          value={`nav-${index}`}
                        >
                          <AccordionTrigger className="h-15 items-center p-0 text-base leading-[3.75] font-bold no-underline hover:no-underline">
                            {item.label}
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pb-2 [&_a]:no-underline">
                            {item.children.map((child) => (
                              <a
                                className={childLinkClasses}
                                href={child.href}
                                key={`${child.label}-${child.href}`}
                                onClick={closeMenu}
                                rel={child.newTab ? 'noreferrer' : undefined}
                                target={child.newTab ? '_blank' : undefined}
                              >
                                <div className="text-base leading-normal whitespace-nowrap">
                                  {child.label}
                                </div>
                              </a>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    }

                    return (
                      <a
                        className={topLevelLinkClasses}
                        href={item.href}
                        key={`${item.label}-${item.href}-${index}`}
                        onClick={closeMenu}
                        rel={item.newTab ? 'noreferrer' : undefined}
                        target={item.newTab ? '_blank' : undefined}
                      >
                        {item.label}
                      </a>
                    )
                  })}
                </Accordion>
              </nav>
            </div>
          </div>

          {ctas.length ? (
            <div className="sticky bottom-0">
              <div className="mx-auto w-full max-w-screen-2xl px-4">
                <div className="flex flex-col gap-4 border-t py-4">
                  {ctas.map((item) =>
                    item.variant === 'link' ? (
                      <ContentLink
                        className="text-base leading-relaxed"
                        href={item.href}
                        key={`${item.label}-${item.href}`}
                        label={item.label}
                        onClick={closeMenu}
                        openInNewTab={item.newTab}
                      />
                    ) : (
                      <Button
                        asChild
                        className="text-base leading-relaxed"
                        key={`${item.label}-${item.href}`}
                        variant={item.variant ?? 'default'}
                      >
                        <a
                          href={item.href}
                          onClick={closeMenu}
                          rel={item.newTab ? 'noreferrer' : undefined}
                          target={item.newTab ? '_blank' : undefined}
                        >
                          <ActionButtonContent label={item.label} showArrow={item.showArrow} />
                        </a>
                      </Button>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import {
  getContentTabClasses,
  type ContentTabSurface,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { cn } from '@/lib/utils'

import { isContactOpen, type ContactSchedule } from './normalizeContactNumbers'

const copyResetMs = 1800

export function CopyNumberButton({
  className,
  phone,
  showLabel = false,
}: {
  className?: string
  phone: string
  showLabel?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone)
    } catch {
      return
    }
    setCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), copyResetMs)
  }

  const Icon = copied ? Check : Copy

  return (
    <button
      aria-label={showLabel ? undefined : copied ? `${phone} copied` : `Copy ${phone}`}
      className={className}
      data-copied={copied || undefined}
      onClick={copy}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {showLabel ? <span>{copied ? 'Copied' : 'Copy'}</span> : null}
      <span aria-live="polite" className="sr-only">
        {copied ? `${phone} copied` : ''}
      </span>
    </button>
  )
}

const minuteMs = 60_000

const subscribeToMinute = (onChange: () => void) => {
  const interval = setInterval(onChange, minuteMs)
  return () => clearInterval(interval)
}

const getCurrentMinute = () => Math.floor(Date.now() / minuteMs)

/** Renders nothing on the server and before hydration, so cached pages never show stale status. */
export function ContactOpenStatus({
  className,
  closedClassName,
  openClassName,
  schedule,
  timeZone,
}: {
  className?: string
  closedClassName?: string
  openClassName?: string
  schedule: ContactSchedule
  timeZone: string
}) {
  const minute = useSyncExternalStore(subscribeToMinute, getCurrentMinute, () => null)
  if (minute === null) return null

  const isOpen = isContactOpen(schedule, new Date(minute * minuteMs), timeZone)

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap',
        className,
        isOpen ? openClassName : closedClassName,
      )}
      data-contact-status={isOpen ? 'open' : 'closed'}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {isOpen ? 'Open now' : 'Closed now'}
    </span>
  )
}

export function ContactDirectoryTabs({
  groups,
  surface,
  variant,
}: {
  groups: { content: ReactNode; name: string }[]
  surface: ContentTabSurface
  variant: ContentTabVariant
}) {
  const [active, setActive] = useState(groups[0]?.name ?? '')

  return (
    <TabsPrimitive.Root
      className="flex min-w-0 flex-col gap-2"
      onValueChange={setActive}
      value={active}
    >
      <ScrollableContentTabRail surface={surface} variant={variant}>
        <TabsPrimitive.List aria-label="Contact groups" className="flex flex-nowrap">
          {groups.map((group) => (
            <TabsPrimitive.Trigger
              className={getContentTabClasses(variant, group.name === active, surface)}
              key={group.name}
              value={group.name}
            >
              {group.name}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </ScrollableContentTabRail>
      {groups.map((group) => (
        <TabsPrimitive.Content className="outline-none" key={group.name} value={group.name}>
          {group.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

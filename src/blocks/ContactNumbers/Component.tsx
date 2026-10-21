import { Clock, Mail, MessageCircle, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  resolveBlockSurface,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { normalizeContentTabVariant } from '@/blocks/shared/contentTabRail'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { normalizeSiteTimeZone } from '@/lib/siteTimeZone'
import { cn } from '@/lib/utils'

import { ContactDirectoryTabs, ContactOpenStatus, CopyNumberButton } from './ContactNumbersClient'
import {
  groupContacts,
  normalizeContacts,
  type ContactInput,
  type ContactNumber,
  type ContactNumbersLayout,
} from './normalizeContactNumbers'

type ContentAlignment = 'left' | 'center' | 'right'

type ContactNumbersBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  availabilityNote?: string | null
  cardColumns?: '2' | '3' | '4' | null
  contacts?: ContactInput[] | null
  contentAlignment?: ContentAlignment | null
  contentPosition?: 'left' | 'right' | 'top' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  layout?: ContactNumbersLayout | null
  showCopyButtons?: boolean | null
  showOpenStatus?: boolean | null
  size?: RegularBlockSize | null
  tabStyle?: string | null
  timeZone?: string | null
  title?: string | null
}

type Theme = {
  isBrand: boolean
  muted: string
  rule: string
  solid: string
  outline: string
  statusClosed: string
  statusOpen: string
}

const resolveTheme = (isBrand: boolean): Theme => ({
  isBrand,
  muted: 'text-current/75',
  rule: 'border-current/15',
  solid: isBrand
    ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
    : 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-current/25 hover:border-current/60 hover:bg-current/10',
  statusOpen: isBrand ? 'bg-primary-foreground/15 text-current' : 'bg-success/12 text-success',
  statusClosed: 'bg-current/8 text-current/70',
})

const focusRing =
  'outline-none focus-visible:ring-3 focus-visible:ring-current/40 focus-visible:ring-offset-0'
const roundButton = cn(
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors motion-reduce:transition-none',
  focusRing,
)
const pillButton = cn(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors motion-reduce:transition-none',
  focusRing,
)
const metaLabelClasses = 'font-mono text-xs font-semibold uppercase tracking-[0.18em]'
const numberClasses = 'font-sans font-semibold tracking-tight tabular-nums'

const alignmentClasses: Record<ContentAlignment, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

const cardColumnClasses = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
} as const

type PresentationProps = {
  contacts: ContactNumber[]
  showCopy: boolean
  showStatus: boolean
  theme: Theme
  timeZone: string
}

function StatusBadge({
  contact,
  showStatus,
  theme,
  timeZone,
}: Pick<PresentationProps, 'showStatus' | 'theme' | 'timeZone'> & { contact: ContactNumber }) {
  if (!showStatus || !contact.schedule) return null

  return (
    <ContactOpenStatus
      closedClassName={theme.statusClosed}
      openClassName={theme.statusOpen}
      schedule={contact.schedule}
      timeZone={timeZone}
    />
  )
}

// ── Switchboard ──────────────────────────────────────────────────────────────
function SwitchboardList({ contacts, showCopy, showStatus, theme, timeZone }: PresentationProps) {
  return (
    <ul
      className={cn('flex min-w-0 flex-col border-y', theme.rule)}
      data-contact-layout="switchboard"
    >
      {contacts.map((contact) => (
        <li
          className={cn(
            'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b py-5 last:border-b-0',
            theme.rule,
          )}
          key={contact.key}
        >
          <div className="flex min-w-0 flex-col gap-2">
            <a
              className={cn(
                'w-fit rounded-compact font-[family-name:var(--font-display)] text-2xl leading-tight font-semibold tracking-tight tabular-nums underline-offset-4 hover:underline sm:text-3xl',
                focusRing,
              )}
              href={contact.telHref}
            >
              {contact.phone}
            </a>
            <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', theme.muted)}>
              {contact.label ? <span className={metaLabelClasses}>{contact.label}</span> : null}
              {contact.hoursText ? <span className="text-sm">{contact.hoursText}</span> : null}
              <StatusBadge
                contact={contact}
                showStatus={showStatus}
                theme={theme}
                timeZone={timeZone}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showCopy ? (
              <CopyNumberButton className={cn(roundButton, theme.outline)} phone={contact.phone} />
            ) : null}
            <a
              aria-label={`Call ${contact.phone}`}
              className={cn(roundButton, theme.solid)}
              href={contact.telHref}
            >
              <Phone aria-hidden="true" className="size-4" />
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Call Desk ────────────────────────────────────────────────────────────────
function CallDeskCard({
  availabilityNote,
  contacts,
  showCopy,
  showStatus,
  theme,
  timeZone,
}: PresentationProps & { availabilityNote?: string }) {
  const headerLabel = contacts.find((contact) => contact.label)?.label

  return (
    <div
      className={cn(
        'min-w-0 overflow-clip rounded-card border border-border bg-card text-card-foreground',
        theme.isBrand ? 'shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]' : 'shadow-sm',
      )}
      data-contact-layout="callDesk"
    >
      {headerLabel ? (
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <p className={cn(metaLabelClasses, 'text-muted-foreground')}>{headerLabel}</p>
        </div>
      ) : null}
      <ul>
        {contacts.map((contact) => (
          <li
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-accent/35 motion-reduce:transition-none sm:px-6"
            key={contact.key}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <a
                className={cn(numberClasses, 'w-fit rounded-compact text-xl', focusRing)}
                href={contact.telHref}
              >
                {contact.phone}
              </a>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {(contact.desk ?? (contact.label !== headerLabel ? contact.label : undefined)) ? (
                  <span>{contact.desk ?? contact.label}</span>
                ) : null}
                {contact.hoursText ? <span>{contact.hoursText}</span> : null}
                <StatusBadge
                  contact={contact}
                  showStatus={showStatus}
                  theme={resolveTheme(false)}
                  timeZone={timeZone}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showCopy ? (
                <CopyNumberButton
                  className={cn(roundButton, 'border border-border hover:bg-accent')}
                  phone={contact.phone}
                />
              ) : null}
              <a
                aria-label={`Call ${contact.phone}`}
                className={cn(
                  roundButton,
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
                href={contact.telHref}
              >
                <Phone aria-hidden="true" className="size-4" />
              </a>
            </div>
          </li>
        ))}
      </ul>
      {availabilityNote ? (
        <p className="border-t border-border bg-muted/50 px-5 py-3 text-sm text-muted-foreground sm:px-6">
          {availabilityNote}
        </p>
      ) : null}
    </div>
  )
}

// ── Desk Cards ───────────────────────────────────────────────────────────────
function DeskCards({
  cardColumns,
  contacts,
  showCopy,
  showStatus,
  theme,
  timeZone,
}: PresentationProps & { cardColumns: keyof typeof cardColumnClasses }) {
  return (
    <ul
      className={cn('grid min-w-0 grid-cols-1 gap-4', cardColumnClasses[cardColumns])}
      data-contact-layout="deskCards"
    >
      {contacts.map((contact) => (
        <li
          className={cn(
            'flex min-w-0 flex-col gap-5 rounded-card border p-5 transition-colors motion-reduce:transition-none sm:p-6',
            theme.rule,
            'hover:border-current/35',
          )}
          key={contact.key}
        >
          {contact.desk || contact.label || (showStatus && contact.schedule) ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                {contact.desk ? (
                  <p className="font-sans text-lg leading-snug font-semibold">{contact.desk}</p>
                ) : null}
                {contact.label ? (
                  <p className={cn(metaLabelClasses, theme.muted)}>{contact.label}</p>
                ) : null}
              </div>
              <StatusBadge
                contact={contact}
                showStatus={showStatus}
                theme={theme}
                timeZone={timeZone}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <a
              className={cn(
                numberClasses,
                'w-fit rounded-compact text-2xl',
                !theme.isBrand && 'text-primary',
                focusRing,
              )}
              href={contact.telHref}
            >
              {contact.phone}
            </a>
            {contact.hoursText ? (
              <p className={cn('flex items-center gap-2 text-sm', theme.muted)}>
                <Clock aria-hidden="true" className="size-4 shrink-0" />
                {contact.hoursText}
              </p>
            ) : null}
          </div>
          <div className={cn('mt-auto flex gap-2 border-t pt-5', theme.rule)}>
            <a className={cn(pillButton, 'flex-1', theme.solid)} href={contact.telHref}>
              <Phone aria-hidden="true" className="size-4" />
              Call
            </a>
            {showCopy ? (
              <CopyNumberButton
                className={cn(pillButton, 'flex-1', theme.outline)}
                phone={contact.phone}
                showLabel
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Help Ribbon ──────────────────────────────────────────────────────────────
function RibbonChips({ contacts, theme }: Pick<PresentationProps, 'contacts' | 'theme'>) {
  return (
    <ul className="flex min-w-0 flex-wrap gap-2.5" data-contact-layout="ribbon">
      {contacts.map((contact, index) => (
        <li key={contact.key}>
          <a
            aria-label={
              contact.label ? `Call ${contact.label}, ${contact.phone}` : `Call ${contact.phone}`
            }
            className={cn(
              'inline-flex min-h-11 items-center gap-2.5 rounded-full px-5 text-base font-semibold tabular-nums transition-colors motion-reduce:transition-none',
              focusRing,
              index === 0 ? theme.solid : theme.outline,
            )}
            href={contact.telHref}
          >
            <Phone aria-hidden="true" className="size-4" />
            {contact.phone}
          </a>
        </li>
      ))}
    </ul>
  )
}

// ── Department Directory ─────────────────────────────────────────────────────
function DirectoryRows({ contacts, showCopy, showStatus, theme, timeZone }: PresentationProps) {
  return (
    <ul className="flex min-w-0 flex-col">
      {contacts.map((contact) => (
        <li
          className={cn(
            'grid grid-cols-1 gap-x-6 gap-y-2 border-b py-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center',
            theme.rule,
          )}
          key={contact.key}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-sans text-base font-semibold">
              {contact.desk ?? contact.label ?? contact.phone}
            </p>
            {(contact.desk && contact.label) || contact.hoursText ? (
              <p className={cn('text-sm', theme.muted)}>
                {[contact.desk ? contact.label : undefined, contact.hoursText]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
            <StatusBadge
              contact={contact}
              showStatus={showStatus}
              theme={theme}
              timeZone={timeZone}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <a
              className={cn(numberClasses, 'w-fit rounded-compact text-lg', focusRing)}
              href={contact.telHref}
            >
              {contact.phone}
            </a>
            {contact.email ? (
              <a
                className={cn(
                  'inline-flex w-fit items-center gap-1.5 rounded-compact text-sm underline-offset-4 hover:underline [overflow-wrap:anywhere]',
                  theme.muted,
                  focusRing,
                )}
                href={`mailto:${contact.email}`}
              >
                <Mail aria-hidden="true" className="size-3.5 shrink-0" />
                {contact.email}
              </a>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {contact.whatsappHref ? (
              <a
                aria-label={`WhatsApp ${contact.phone}`}
                className={cn(roundButton, theme.outline)}
                href={contact.whatsappHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
              </a>
            ) : null}
            {showCopy ? (
              <CopyNumberButton className={cn(roundButton, theme.outline)} phone={contact.phone} />
            ) : null}
            <a
              aria-label={`Call ${contact.phone}`}
              className={cn(roundButton, theme.solid)}
              href={contact.telHref}
            >
              <Phone aria-hidden="true" className="size-4" />
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ContactNumbersBlockComponent({
  accentTitle,
  actions,
  appearance,
  availabilityNote,
  cardColumns = '3',
  contacts,
  contentAlignment = 'left',
  contentPosition = 'left',
  description,
  eyebrow,
  footerActions,
  layout = 'switchboard',
  showCopyButtons = true,
  showOpenStatus = true,
  size = 'default',
  tabStyle,
  timeZone,
  title,
}: ContactNumbersBlockLike) {
  const resolvedContacts = normalizeContacts(contacts)
  if (resolvedContacts.length === 0) return null

  const resolvedLayout: ContactNumbersLayout = layout ?? 'switchboard'
  const alignment: ContentAlignment = contentAlignment ?? 'left'
  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const isBrand = resolveBlockSurface(background) === 'brand'
  const theme = resolveTheme(isBrand)
  const resolvedActions = resolveCmsActions(actions)
  const note = availabilityNote?.trim() || undefined
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const hasHeader = Boolean(
    eyebrow?.trim() ||
    resolvedTitle ||
    resolvedAccentTitle ||
    description?.trim() ||
    resolvedActions.length,
  )
  const presentationProps: PresentationProps = {
    contacts: resolvedContacts,
    showCopy: showCopyButtons !== false,
    showStatus: showOpenStatus !== false,
    theme,
    timeZone: normalizeSiteTimeZone(timeZone),
  }

  const header = hasHeader ? (
    <div
      className={cn(
        contentIntroClasses,
        'w-full min-w-0 [overflow-wrap:anywhere]',
        alignmentClasses[alignment],
      )}
      data-contact-numbers-content="true"
    >
      {eyebrow?.trim() ? (
        <SectionEyebrow surface={background}>{eyebrow.trim()}</SectionEyebrow>
      ) : null}
      {resolvedTitle || resolvedAccentTitle ? (
        <h2
          className={cn(
            contentSectionHeadingClasses,
            resolvedLayout === 'ribbon' && 'text-2xl sm:text-3xl',
          )}
        >
          {resolvedTitle}
          {resolvedAccentTitle ? (
            <>
              {resolvedTitle ? ' ' : ''}
              <span className="italic">{resolvedAccentTitle}</span>
            </>
          ) : null}
        </h2>
      ) : null}
      {description?.trim() ? (
        <p className={cn(contentSectionDescriptionClasses, theme.muted)}>{description.trim()}</p>
      ) : null}
      {resolvedLayout === 'ribbon' && note ? (
        <p className={cn('text-sm', theme.muted)}>{note}</p>
      ) : null}
      {resolvedActions.length > 0 ? (
        <ContentActions actions={resolvedActions} alignment={alignment} className="mt-2" />
      ) : null}
    </div>
  ) : null

  let numbers: ReactNode
  if (resolvedLayout === 'callDesk') {
    numbers = <CallDeskCard {...presentationProps} availabilityNote={note} />
  } else if (resolvedLayout === 'deskCards') {
    numbers = <DeskCards {...presentationProps} cardColumns={cardColumns ?? '3'} />
  } else if (resolvedLayout === 'ribbon') {
    numbers = <RibbonChips contacts={resolvedContacts} theme={theme} />
  } else if (resolvedLayout === 'directory') {
    const groups = groupContacts(resolvedContacts)
    numbers =
      groups.length > 1 ? (
        <ContactDirectoryTabs
          groups={groups.map((group) => ({
            content: <DirectoryRows {...presentationProps} contacts={group.items} />,
            name: group.name,
          }))}
          surface={isBrand ? 'brand' : 'light'}
          variant={normalizeContentTabVariant(tabStyle)}
        />
      ) : (
        <div className={cn('border-t', theme.rule)}>
          <DirectoryRows {...presentationProps} />
        </div>
      )
  } else {
    numbers = <SwitchboardList {...presentationProps} />
  }

  const showNoteBelow =
    Boolean(note) && resolvedLayout !== 'callDesk' && resolvedLayout !== 'ribbon'
  const numbersColumn = (
    <div className="flex min-w-0 flex-col gap-4">
      {numbers}
      {showNoteBelow ? <p className={cn('text-sm', theme.muted)}>{note}</p> : null}
    </div>
  )

  const canSplit =
    resolvedLayout === 'switchboard' ||
    resolvedLayout === 'callDesk' ||
    resolvedLayout === 'directory'
  const isSplit = Boolean(header) && canSplit && contentPosition !== 'top'
  const contentOnRight = contentPosition === 'right'

  let body: ReactNode
  if (resolvedLayout === 'ribbon') {
    body = (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {header}
        <div className={cn('min-w-0', header && 'lg:max-w-[60%]')}>{numbersColumn}</div>
      </div>
    )
  } else if (isSplit) {
    body = (
      <div
        className={cn(
          'grid min-w-0 grid-cols-1 items-center gap-10 lg:gap-16',
          contentOnRight
            ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
            : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
        )}
      >
        <div className={cn('min-w-0', contentOnRight && 'lg:col-start-2 lg:row-start-1')}>
          {header}
        </div>
        {numbersColumn}
      </div>
    )
  } else {
    body = (
      <div className="flex min-w-0 flex-col gap-10">
        {header}
        {numbersColumn}
      </div>
    )
  }

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-contact-numbers="true"
      data-contact-numbers-layout={resolvedLayout}
    >
      <div className={regularBlockContainerClasses}>
        {body}
        <BlockFooterActions actions={footerActions} alignment={alignment} />
      </div>
    </section>
  )
}
